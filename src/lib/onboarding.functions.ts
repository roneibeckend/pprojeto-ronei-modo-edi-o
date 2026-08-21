import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('user_onboarding' as any)
      .select('*')
      .eq('user_id', context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const onboardingData = data as any;
    return { hasSeenOnboarding: onboardingData?.has_seen_onboarding ?? false };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from('user_onboarding' as any)
      .upsert({
        user_id: context.userId,
        has_seen_onboarding: true,
        last_seen_at: new Date().toISOString()
      } as any);

    if (error) throw new Error(error.message);

    return { success: true };
  });
