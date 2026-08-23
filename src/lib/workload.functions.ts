import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { WorkloadExtras, WorkloadSuggestion } from "@/lib/workload.server";

export type SuggestWorkloadInput = {
  contentId: string;
  contentType: "course" | "ebook";
  extras?: WorkloadExtras;
};

export const suggestWorkloadHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SuggestWorkloadInput) => input)
  .handler(async ({ data, context }): Promise<WorkloadSuggestion> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado.");

    const { computeWorkload } = await import("@/lib/workload.server");
    return computeWorkload(data.contentId, data.contentType, data.extras);
  });
