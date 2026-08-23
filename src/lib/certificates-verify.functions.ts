import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({
    code: z.string().min(1)
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const code = data.code.trim().toUpperCase();

    const { data: certificate, error } = await supabaseAdmin
      .from('certificates' as any)
      .select(`
        *,
        template:certificate_templates(*)
      `)
      .eq('certificate_code', code)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!certificate) return { found: false as const };

    const cert = certificate as any;
    if (cert.is_revoked) {
      return { found: true as const, isValid: false as const, reason: 'revoked' as const };
    }

    const [{ data: profile }, contentRes, hours] = await Promise.all([
      supabaseAdmin.from('profiles' as any).select('name').eq('id', cert.student_id).maybeSingle(),
      cert.content_type === 'course'
        ? supabaseAdmin.from('courses' as any).select('title').eq('id', cert.content_id).maybeSingle()
        : supabaseAdmin.from('ebooks' as any).select('title').eq('id', cert.content_id).maybeSingle(),
      import("@/lib/certificate-hours.server").then((m) =>
        m.estimateContentHours(cert.content_id, cert.content_type)
      ),
    ]);

    return {
      found: true as const,
      isValid: true as const,
      code: cert.certificate_code,
      contentType: cert.content_type,
      cityOfIssue: cert.city_of_issue || 'Goiânia · Goiás',
      templateBackground: cert.template?.background_url || null,
      studentName: (profile as any)?.name || 'Aluno',
      contentTitle: (contentRes.data as any)?.title || 'Conteúdo Removido',
      hours,
      issueDateFormatted: new Date(cert.issue_date).toLocaleDateString('pt-BR'),
    };
  });
