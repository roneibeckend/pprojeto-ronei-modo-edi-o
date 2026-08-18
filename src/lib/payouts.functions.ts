import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { processPixPayout, detectPixKeyType } from "./asaas-payouts.server";

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    amount: z.number().positive(),
    method: z.string(),
    pix_key: z.string().optional(),
    user_type: z.enum(['affiliate', 'partner']).default('affiliate'),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    // 1. Validar saldo baseado no tipo de usuário
    if (data.user_type === 'affiliate') {
      const { data: affiliate, error: affError } = await supabaseAdmin
        .from('affiliates')
        .select('balance')
        .eq('id', userId)
        .maybeSingle();

      if (affError || !affiliate) throw new Error("Afiliado não encontrado.");
      if (affiliate.balance < data.amount) throw new Error("Saldo insuficiente.");

      // 2. Criar solicitação e descontar saldo
      const { error: payoutError } = await supabaseAdmin
        .from('payout_requests')
        .insert({
          user_id: userId,
          amount: data.amount,
          method: data.method,
          pix_key: data.pix_key,
          status: 'pending',
          metadata: { user_type: 'affiliate' }
        });

      if (payoutError) throw new Error("Erro ao solicitar saque: " + payoutError.message);

      await supabaseAdmin
        .from('affiliates')
        .update({ balance: affiliate.balance - data.amount })
        .eq('id', userId);
    } else {
      const { data: partner, error: partError } = await supabaseAdmin
        .from('partner_balances')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (partError || !partner) throw new Error("Saldo de sócio não encontrado.");
      if (partner.balance < data.amount) throw new Error("Saldo insuficiente.");

      const { error: payoutError } = await supabaseAdmin
        .from('payout_requests')
        .insert({
          user_id: userId,
          amount: data.amount,
          method: data.method,
          pix_key: data.pix_key,
          status: 'pending',
          metadata: { user_type: 'partner' }
        });

      if (payoutError) throw new Error("Erro ao solicitar saque: " + payoutError.message);

      await supabaseAdmin
        .from('partner_balances')
        .update({ balance: partner.balance - data.amount })
        .eq('user_id', userId);
    }

    return { success: true };
  });

export const getPayoutHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data, error } = await supabaseAdmin
      .from('payout_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  });

export const adminUpdatePayoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    payoutId: z.string(),
    status: z.enum(['analyzing', 'approved', 'paid', 'rejected']),
  }).parse(data))
  .handler(async ({ data, context }) => {
    // 0. Apenas admins podem alterar status de saques
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });
    if (!isAdmin) throw new Error("Acesso negado.");

    // 1. Verificar se o registro existe e qual o valor/tipo
    const { data: payout, error: fetchError } = await supabaseAdmin
      .from('payout_requests')
      .select('*')
      .eq('id', data.payoutId)
      .maybeSingle();

    if (fetchError || !payout) throw new Error("Solicitação não encontrada.");
    if (payout.status === 'paid' && data.status === 'paid') return { success: true }; // Já processado

    // AUTOMATION: Se o status for alterado para 'paid', tentamos realizar o pagamento via Asaas se for Pix
    let asaasResult = null;
    if (data.status === 'paid' && payout.status !== 'paid') {
      if (payout.method.toUpperCase().includes('PIX') && payout.pix_key) {
        try {
          console.log(`[Admin Payout] Iniciando pagamento automático Pix via Asaas para Payout ID: ${payout.id}`);
          const keyType = detectPixKeyType(payout.pix_key);
          
          asaasResult = await processPixPayout({
            amount: payout.amount,
            pixKey: payout.pix_key,
            pixKeyType: keyType,
            description: `Saque ${(payout.metadata as any)?.user_type === 'partner' ? 'Sócio' : 'Afiliado'} - Ronnei na Veia`
          });
          
          console.log(`[Admin Payout] Pagamento Asaas processado com sucesso:`, asaasResult.id);
        } catch (error: any) {
          console.error(`[Admin Payout] Falha no pagamento Asaas:`, error);
          throw new Error(`Falha ao processar pagamento no Asaas: ${error.message}. O status não foi alterado.`);
        }
      } else if (data.status === 'paid') {
        // Se for manual, permitimos mudar para pago sem Asaas, mas avisamos no log
        console.log(`[Admin Payout] Marcando como pago manualmente (sem Pix Asaas) para Payout ID: ${payout.id}`);
      }
    }

    // 2. Se o novo status for 'paid', atualizar o acumulado retirado do sócio
    if (data.status === 'paid' && payout.status !== 'paid') {
      const userType = (payout.metadata as any)?.user_type;
      
      if (userType === 'partner') {
        const { error: balanceError } = await supabaseAdmin.rpc('increment_partner_withdrawn', {
          p_user_id: payout.user_id,
          p_amount: payout.amount
        });
        if (balanceError) throw new Error("Erro ao atualizar acumulado: " + balanceError.message);
      }
    }

    // 3. Atualizar o status do saque e salvar ID do Asaas se houver
    const updateData: any = { 
      status: data.status,
      updated_at: new Date().toISOString()
    };
    
    if (asaasResult?.id) {
      updateData.asaas_payment_id = asaasResult.id;
    }

    const { error } = await supabaseAdmin
      .from('payout_requests')
      .update(updateData)
      .eq('id', data.payoutId);

    if (error) throw error;
    
    // Logar evento de sistema
    await supabaseAdmin.rpc('log_system_event', {
      _level: 'info',
      _source: 'payout_system',
      _message: `Saque ${data.payoutId} alterado para ${data.status}. ${asaasResult?.id ? 'Pagamento Asaas: ' + asaasResult.id : ''}`,
      _details: { payoutId: data.payoutId, status: data.status, asaasId: asaasResult?.id }
    });

    return { success: true };
  });

export const distributeProfits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    amount: z.number().positive(),
    partnerId: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    // Apenas admins podem distribuir
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    
    if (!isAdmin) throw new Error("Acesso negado.");

    const { error } = await supabaseAdmin.rpc('distribute_partner_profits', {
      p_amount: data.amount,
      p_partner_id: data.partnerId
    });

    if (error) throw error;
    
    // Tentar buscar a chave Pix do sócio para criar a solicitação automática
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates') // Sócios costumam estar aqui também ou ter perfil com pix
      .select('pix_key')
      .eq('id', data.partnerId)
      .maybeSingle();
      
    // Se tiver chave Pix, podemos criar a solicitação de saque imediatamente como 'approved' para processamento rápido
    if (affiliate?.pix_key) {
      // 1. Descontar do saldo recém adicionado (Atomicamente já foi adicionado pelo RPC acima)
      // 2. Criar solicitação aprovada
      const { error: payoutError } = await supabaseAdmin
        .from('payout_requests')
        .insert({
          user_id: data.partnerId,
          amount: data.amount,
          method: 'PIX',
          pix_key: affiliate.pix_key,
          status: 'approved', // Já aprovado para facilitar o clique final do admin ou automação
          metadata: { user_type: 'partner', auto_distributed: true }
        });
        
      if (!payoutError) {
        // Descontar do saldo (partner_balances)
        const { data: balance } = await supabaseAdmin
          .from('partner_balances')
          .select('balance')
          .eq('user_id', data.partnerId)
          .maybeSingle();
          
        if (balance) {
          await supabaseAdmin
            .from('partner_balances')
            .update({ balance: balance.balance - data.amount })
            .eq('user_id', data.partnerId);
        }
      }
    }

    return { success: true };
  });
