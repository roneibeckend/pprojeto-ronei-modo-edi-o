import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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
  .validator((data: any) => z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    isGlobal: z.boolean()
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("integrations")
      .upsert({
        category: "ranking_settings",
        name: "Configuração de Ranking Global",
        status: true,
        type: "ia", // Using 'ia' as a generic type since it's required and we are storing config
        settings: data as any
      }, { onConflict: "category,name" });
    
    if (error) throw error;
    return { success: true };
  });
