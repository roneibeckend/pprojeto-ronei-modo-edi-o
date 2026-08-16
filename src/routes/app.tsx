import { createFileRoute, Outlet, useNavigate, navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Shell } from "@/components/platform/Shell";
import { supabase } from "@/integrations/supabase/client";
import { AsaasPaymentModal } from "@/components/platform/AsaasPaymentModal";
import { OnboardingGuide } from "@/components/platform/OnboardingGuide";

export const Route = createFileRoute("/app")({
  ssr: false,
  loader: async ({ context: { queryClient } }) => {
    // Prefetch user session and profile to avoid waterfalls in Shell and children
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/app';
      throw navigate({ to: `/login?redirectTo=${encodeURIComponent(currentPath)}`, replace: true });
    }

    // Parallel prefetch common app data
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ["user-enrollments", session.user.id],
        queryFn: async () => {
          const [courses, ebooks] = await Promise.all([
             supabase.from("course_enrollments").select("course_id").eq("user_id", session.user.id),
             supabase.from("ebook_enrollments").select("ebook_id").eq("user_id", session.user.id)
          ]);
          return {
            courseEnrollments: courses.data?.map(e => e.course_id) || [],
            ebookEnrollments: ebooks.data?.map(e => e.ebook_id) || []
          };
        }
      }),
      queryClient.ensureQueryData({
        queryKey: ["interactive-previews-status"],
        queryFn: async () => {
          const { data } = await supabase.from('integrations').select('status').eq('category', 'interactive_previews').maybeSingle();
          return data?.status ?? false;
        }
      })
    ]);
  },
  head: () => ({
    meta: [
      { title: "Plataforma — Espetinho na Veia" },
      { name: "description", content: "Área de membros da plataforma Espetinho na Veia — cursos, e-books, receitas e materiais." },
    ],
  }),
  component: AppGate,
});

function AppGate() {
  return (
    <>
      <Shell>
        <Outlet />
      </Shell>
      <AsaasPaymentModal />
      <OnboardingGuide />
    </>
  );
}