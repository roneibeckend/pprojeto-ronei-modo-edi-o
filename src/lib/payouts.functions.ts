import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
        .single();

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
        .single();

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
    // 1. Verificar se o registro existe e qual o valor/tipo
    const { data: payout, error: fetchError } = await supabaseAdmin
      .from('payout_requests')
      .select('*')
      .eq('id', data.payoutId)
      .single();

    if (fetchError || !payout) throw new Error("Solicitação não encontrada.");
    if (payout.status === 'paid') return { success: true }; // Já processado

    // 2. Se o novo status for 'paid', atualizar o acumulado retirado do sócio
    if (data.status === 'paid') {
      const userType = (payout.metadata as any)?.user_type;
      
      if (userType === 'partner') {
        const { error: balanceError } = await supabaseAdmin.rpc('increment_partner_withdrawn', {
          p_user_id: payout.user_id,
          p_amount: payout.amount
        });
        if (balanceError) throw new Error("Erro ao atualizar acumulado: " + balanceError.message);
      }
    }

    // 3. Atualizar o status do saque
    const { error } = await supabaseAdmin
      .from('payout_requests')
      .update({ status: data.status })
      .eq('id', data.payoutId);

    if (error) throw error;
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
      p_user_id: data.partnerId
    });

    if (error) throw error;
    return { success: true };
  });
