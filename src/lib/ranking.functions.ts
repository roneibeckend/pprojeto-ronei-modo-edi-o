import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getRankingSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("integrations")
      .select("settings")
      .eq("category", "ranking_settings")
      .maybeSingle();
    
    if (error) throw error;
    return data?.settings as { startDate: string | null; endDate: string | null; isGlobal: boolean } || { startDate: null, endDate: null, isGlobal: true };
  });

export const updateRankingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    isGlobal: z.boolean()
  }).parse(data))
  .handler(async ({ data, context }) => {
    // Check if user is admin via the has_role function
    const { data: hasRole, error: roleError } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });

    if (roleError || !hasRole) {
      throw new Error("Unauthorized: Only admins can manage ranking settings");
    }

      const upsertData: any = {
        category: "ranking_settings",
        name: "Configuração de Ranking Global",
        status: true,
        type: "ia",
        settings: data as any,
        updated_at: new Date().toISOString()
      };

      // Garantindo que a coluna credentials (geralmente obrigatória) esteja presente
      upsertData.credentials = {};

      const { error } = await supabaseAdmin
        .from("integrations")
        .upsert(upsertData, { onConflict: "category" });
    
    if (error) throw error;
    return { success: true };
  });
