import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const verifyCertificate = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    code: z.string().min(1)
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: certificate, error } = await supabaseAdmin
      .from('certificates' as any)
      .select(`
        *,
        student:profiles!inner(full_name, email)
      `)
      .eq('certificate_code', data.code)
      .eq('is_revoked', false)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!certificate) return null;

    const contentRes = certificate.content_type === 'course'
      ? await supabaseAdmin.from('courses' as any).select('title').eq('id', certificate.content_id).maybeSingle()
      : await supabaseAdmin.from('ebooks' as any).select('title').eq('id', certificate.content_id).maybeSingle();

    return {
      ...certificate,
      studentName: certificate.student?.full_name || 'Aluno',
      contentTitle: contentRes.data?.title || 'Conteúdo Removido',
      issueDateFormatted: new Date(certificate.issue_date).toLocaleDateString('pt-BR'),
      isValid: true
    };
  });
