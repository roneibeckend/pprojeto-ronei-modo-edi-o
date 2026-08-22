import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Acesso negado.");
  return supabaseAdmin;
}

export const syncAsaasTransfers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { syncTransfersWithDb } = await import("./asaas-transfers.server");
    const result = await syncTransfersWithDb();
    return { success: true, count: result.length };
  });

export const createManualTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        amount: z.number().positive(),
        transfer_date: z.string(),
        description: z.string().min(1),
        status: z.string().default("DONE"),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertAdmin(context.userId);

    const { data: row, error } = await supabaseAdmin
      .from("asaas_transfers")
      .insert({
        amount: data.amount,
        transfer_date: data.transfer_date,
        description: data.description,
        status: data.status,
        transaction_type: "manual",
      })
      .select()
      .single();

    if (error) throw error;
    return row;
  });
