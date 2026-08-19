import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const syncAsaasTransfers = createServerFn({ method: "POST" })
  .handler(async () => {
    const { syncTransfersWithDb } = await import("./asaas-transfers.server");
    const result = await syncTransfersWithDb();
    return { success: true, count: result.length };
  });

export const createManualTransfer = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    data: z.object({
      amount: z.number(),
      transfer_date: z.string(),
      description: z.string(),
      status: z.string().default('DONE')
    })
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data, error } = await supabaseAdmin
      .from('asaas_transfers')
      .insert({
        ...input.data,
        transaction_type: 'manual'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  });
