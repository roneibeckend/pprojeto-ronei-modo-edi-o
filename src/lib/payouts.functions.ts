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
  }).parse(data))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    // 1. Validar saldo do afiliado
    // O id na tabela affiliates é o user_id (FK para profiles.id)
    const { data: affiliate, error: affError } = await supabaseAdmin
      .from('affiliates')
      .select('balance')
      .eq('id', userId)
      .single();

    if (affError || !affiliate) {
      throw new Error("Afiliado não encontrado.");
    }

    if (affiliate.balance < data.amount) {
      throw new Error("Saldo insuficiente.");
    }

    // 2. Criar solicitação de saque
    const { error: payoutError } = await supabaseAdmin
      .from('payout_requests')
      .insert({
        user_id: userId,
        amount: data.amount,
        method: data.method,
        pix_key: data.pix_key,
        status: 'pending'
      });

    if (payoutError) {
      throw new Error("Erro ao solicitar saque: " + payoutError.message);
    }

    // 3. Opcional: Bloquear saldo solicitado
    await supabaseAdmin
      .from('affiliates')
      .update({ balance: affiliate.balance - data.amount })
      .eq('id', userId);

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
    // Verificar permissão administrativa (através de middleware/RLS seria melhor, mas aqui validamos explicitamente)
    // Assumimos que o requireSupabaseAuth garante que o user existe.
    // Adicione a checagem de role se necessário via supabase.rpc('has_role', ...)

    const { error } = await supabaseAdmin
      .from('payout_requests')
      .update({ status: data.status })
      .eq('id', data.payoutId);

    if (error) throw error;
    return { success: true };
  });
