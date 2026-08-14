import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getFinancialSummary = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => 
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    // Only CONFIRMED, RECEIVED or RECEIVED_IN_CASH are considered real revenue
    let query = supabaseAdmin
      .from("payments")
      .select("net_amount, created_at")
      .in("status", ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);

    if (data.startDate) {
      query = query.gte("created_at", data.startDate);
    }
    
    if (data.endDate) {
      query = query.lte("created_at", data.endDate);
    }

    const { data: payments, error } = await query;

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
