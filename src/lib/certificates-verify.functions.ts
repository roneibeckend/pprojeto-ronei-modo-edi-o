import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

    const cert = certificate as any;

    const contentRes = cert.content_type === 'course'
      ? await supabaseAdmin.from('courses' as any).select('title').eq('id', cert.content_id).maybeSingle()
      : await supabaseAdmin.from('ebooks' as any).select('title').eq('id', cert.content_id).maybeSingle();

    return {
      ...cert,
      studentName: cert.student?.full_name || 'Aluno',
      contentTitle: (contentRes.data as any)?.title || 'Conteúdo Removido',
      issueDateFormatted: new Date(cert.issue_date).toLocaleDateString('pt-BR'),
      isValid: true
    };
  });
