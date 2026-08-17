import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data, error } = await supabaseAdmin
      .from('user_onboarding' as any)
      .select('has_seen_onboarding' as any)
      .eq('user_id', context.userId)
      .maybeSingle();
      
    if (error) throw new Error(error.message);
    
    return { hasSeenOnboarding: data?.has_seen_onboarding ?? false };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from('user_onboarding' as any)
      .upsert({ 
        user_id: context.userId, 
        has_seen_onboarding: true,
        last_seen_at: new Date().toISOString()
      } as any);
      
    if (error) throw new Error(error.message);
    
    return { success: true };
  });
