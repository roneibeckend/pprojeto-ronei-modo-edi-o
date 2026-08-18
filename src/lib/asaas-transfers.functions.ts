// src/lib/asaas-transfers.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { syncTransfersWithDb } from "./asaas-transfers.server";

export const syncAsaasTransfers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Verificar se o usuário é admin
    const { data: roleData } = await supabaseAdmin.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });

    if (!roleData) {
      throw new Error("Unauthorized: Admin role required");
    }

    try {
      const data = await syncTransfersWithDb();
      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error("[Asaas Transfers] Sync function error:", error);
      throw new Error(error.message || "Falha ao sincronizar transferências com Asaas");
    }
  });

export const createManualTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    amount: z.number(),
    transfer_date: z.string(),
    description: z.string().optional(),
    status: z.string().default('DONE')
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: roleData } = await supabaseAdmin.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });

    if (!roleData) {
      throw new Error("Unauthorized: Admin role required");
    }

    const { data: result, error } = await supabaseAdmin
      .from('asaas_transfers')
      .insert({
        amount: data.amount,
        transfer_date: data.transfer_date,
        description: data.description || 'Lançamento manual de saída',
        status: data.status,
        transaction_type: 'manual'
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  });
