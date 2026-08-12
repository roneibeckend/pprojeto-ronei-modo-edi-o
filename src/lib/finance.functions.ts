import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getFinancialSummary = createServerFn({ method: "GET" })
  .handler(async () => {
    // Only CONFIRMED, RECEIVED or RECEIVED_IN_CASH are considered real revenue
    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("net_amount")
      .in("status", ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);

    if (error) {
      console.error("[Finance] Error fetching payments:", error);
      throw error;
    }

    const totalNetRevenue = payments?.reduce((acc, p) => acc + Number(p.net_amount), 0) || 0;

    return {
      totalNetRevenue,
      paymentCount: payments?.length || 0
    };
  });
