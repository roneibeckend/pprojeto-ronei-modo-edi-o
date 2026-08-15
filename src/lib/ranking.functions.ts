import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getRankingSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
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

    // Use supabaseAdmin to perform the operation to ensure it bypasses RLS if needed,
    // though the user is an admin and the policy should allow it.
    // However, the policy "Admins can manage integrations" uses has_role(auth.uid(), 'admin')
    // which requires the auth session to be correctly passed to the database.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("integrations")
      .upsert({
        category: "ranking_settings",
        name: "Configuração de Ranking Global",
        status: true,
        type: "ia",
        settings: data as any,
        credentials: {} // Add missing required credentials column
      }, { onConflict: "category" });
    
    if (error) throw error;
    return { success: true };
  });
