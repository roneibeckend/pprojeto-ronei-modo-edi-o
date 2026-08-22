import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    if (data.user_type === 'affiliate') {
      const { data: affiliate, error: affError } = await supabaseAdmin
        .from('affiliates')
        .select('balance')
        .eq('id', userId)
        .maybeSingle();

      if (affError || !affiliate) throw new Error("Afiliado não encontrado.");
      if (affiliate.balance < data.amount) throw new Error("Saldo insuficiente.");

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 0. Apenas admins podem alterar status de saques
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });
    if (!isAdmin) throw new Error("Acesso negado.");

    // 1. Verificar se o registro existe
    const { data: payout, error: fetchError } = await supabaseAdmin
      .from('payout_requests')
      .select('*')
      .eq('id', data.payoutId)
      .maybeSingle();

    if (fetchError || !payout) throw new Error("Solicitação não encontrada.");
    
    // Se já está pago e o novo status é pago, não faz nada
    if (payout.status === 'paid' && data.status === 'paid') return { success: true };

    // AUTOMATION: Se o status for alterado para 'paid', processa via Asaas se for Pix
    let asaasResult = null;
    if (data.status === 'paid' && payout.status !== 'paid') {
      const isPix = payout.method.toUpperCase().includes('PIX') || (payout.pix_key && payout.pix_key.length > 5);
      
      if (isPix && payout.pix_key) {
        try {
          console.log(`[Payout Automation] Iniciando pagamento Pix Asaas para Payout: ${payout.id}`);
          const keyType = detectPixKeyType(payout.pix_key);
          
          asaasResult = await processPixPayout({
            amount: payout.amount,
            pixKey: payout.pix_key,
            pixKeyType: keyType,
            description: `Saque ${(payout.metadata as any)?.user_type === 'partner' ? 'Sócio' : 'Afiliado'} - Ronnei na Veia`
          });
          
          console.log(`[Payout Automation] Pagamento Asaas confirmado: ${asaasResult.id}`);
        } catch (error: any) {
          console.error(`[Payout Automation] Falha no Asaas:`, error);
          throw new Error(`Erro no Asaas: ${error.message}. O status do saque não foi alterado.`);
        }
      } else {
        console.log(`[Payout Automation] Marcando como pago manualmente para Payout: ${payout.id}`);
      }
    }

    // 2. Se o novo status for 'paid', atualizar acumulado do sócio
    if (data.status === 'paid' && payout.status !== 'paid') {
      const userType = (payout.metadata as any)?.user_type;
      if (userType === 'partner') {
        const { error: balanceError } = await supabaseAdmin.rpc('increment_partner_withdrawn', {
          p_user_id: payout.user_id,
          p_amount: payout.amount
        });
        if (balanceError) console.error("Erro ao atualizar acumulado de sócio:", balanceError);
      }
    }

    // 3. Persistir novo status e ID do Asaas
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

    // 3.1 Registrar a saída de caixa no livro de movimentações (Gestão de Saídas e Saques)
    if (data.status === 'paid' && payout.status !== 'paid') {
      const userType = (payout.metadata as any)?.user_type === 'partner' ? 'Sócio' : 'Afiliado';
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name, email')
        .eq('id', payout.user_id)
        .maybeSingle();

      const { error: ledgerError } = await supabaseAdmin
        .from('asaas_transfers')
        .insert({
          asaas_id: asaasResult?.id ?? null,
          amount: payout.amount,
          status: 'DONE',
          transfer_date: new Date().toISOString(),
          description: `Saque ${userType} — ${profile?.name || profile?.email || payout.user_id}`,
          transaction_type: 'payout',
          metadata: {
            payout_id: payout.id,
            user_id: payout.user_id,
            user_type: (payout.metadata as any)?.user_type || 'affiliate',
            method: payout.method,
            pix_key: payout.pix_key ? `***${String(payout.pix_key).slice(-4)}` : null,
            asaas_id: asaasResult?.id ?? null,
          },
        });

      if (ledgerError) console.error('[Payout Ledger] Falha ao registrar saída:', ledgerError);
    }


    
    // Log de auditoria
    await supabaseAdmin.rpc('log_system_event', {
      _level: 'info',
      _source: 'payout_service',
      _message: `Saque ${data.payoutId} atualizado para ${data.status}. ${asaasResult?.id ? 'Asaas ID: ' + asaasResult.id : ''}`,
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    if (!isAdmin) throw new Error("Acesso negado.");

    // Distribuição de lucros no banco
    const { error: distError } = await supabaseAdmin.rpc('distribute_partner_profits', {
      p_amount: data.amount,
      p_partner_id: data.partnerId
    });
    if (distError) throw distError;

    // Automação: Criar solicitação de saque se o sócio tiver chave Pix
    const { data: partnerProfile } = await supabaseAdmin
      .from('affiliates') 
      .select('pix_key')
      .eq('id', data.partnerId)
      .maybeSingle();
      
    if (partnerProfile?.pix_key) {
      // Criar solicitação já aprovada para processamento rápido
      const { error: payoutError } = await supabaseAdmin
        .from('payout_requests')
        .insert({
          user_id: data.partnerId,
          amount: data.amount,
          method: 'PIX',
          pix_key: partnerProfile.pix_key,
          status: 'approved',
          metadata: { user_type: 'partner', auto_distributed: true }
        });
        
      if (!payoutError) {
        // Deduz do saldo disponível que acabamos de adicionar
        const { data: balanceRow } = await supabaseAdmin
          .from('partner_balances')
          .select('balance')
          .eq('user_id', data.partnerId)
          .maybeSingle();
          
        if (balanceRow) {
          await supabaseAdmin
            .from('partner_balances')
            .update({ balance: Math.max(0, balanceRow.balance - data.amount) })
            .eq('user_id', data.partnerId);
        }
      }
    }

    return { success: true };
  });
