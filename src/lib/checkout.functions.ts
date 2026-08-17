import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** 
 * Persiste a intenção de compra do usuário logado.
 * Útil para recuperar o checkout após redirecionamentos ou recarregamentos.
 */
export const savePendingCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    productId: z.string(),
    productType: z.enum(['course', 'ebook']),
    metadata: z.record(z.any()).optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Desativa checkouts pendentes anteriores para este usuário
    await supabaseAdmin
      .from('pending_checkouts')
      .update({ status: 'expired' })
      .eq('user_id', context.userId)
      .eq('status', 'pending');

    const { data: result, error } = await supabaseAdmin
      .from('pending_checkouts')
      .insert([{
        user_id: context.userId,
        product_id: data.productId,
        product_type: data.productType,
        metadata: data.metadata || {},
        status: 'pending'
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return result;
  });

/**
 * Recupera o último checkout pendente do usuário.
 */
export const getPendingCheckout = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data, error } = await supabaseAdmin
      .from('pending_checkouts')
      .select('*')
      .eq('user_id', context.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  });

/**
 * Marca um checkout como concluído.
 */
export const completePendingCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    checkoutId: z.string()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from('pending_checkouts')
      .update({ status: 'completed' })
      .eq('id', data.checkoutId)
      .eq('user_id', context.userId);

    if (error) throw error;
    return { success: true };
  });
