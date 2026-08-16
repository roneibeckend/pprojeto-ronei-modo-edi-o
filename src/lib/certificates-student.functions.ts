import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getStudentCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: certificates, error: certError } = await supabaseAdmin
      .from('certificates' as any)
      .select(`
        *,
        template:certificate_templates(*)
      `)
      .eq('student_id', context.userId)
      .eq('is_revoked', false);

    if (certError) throw new Error(certError.message);

    const certs = (certificates || []) as any[];
    if (certs.length === 0) return [];

    const courseIds = certs.filter(c => c.content_type === 'course').map(c => c.content_id);
    const ebookIds = certs.filter(c => c.content_type === 'ebook').map(c => c.content_id);

    const [courseRes, ebookRes] = await Promise.all([
      courseIds.length > 0 
        ? supabaseAdmin.from('courses' as any).select('id, title').in('id', courseIds)
        : Promise.resolve({ data: [] as any[] }),
      ebookIds.length > 0
        ? supabaseAdmin.from('ebooks' as any).select('id, title').in('id', ebookIds)
        : Promise.resolve({ data: [] as any[] })
    ]);

    const courseList = (courseRes.data || []) as any[];
    const ebookList = (ebookRes.data || []) as any[];

    return certs.map(cert => {
      const content = cert.content_type === 'course' 
        ? courseList.find(c => c.id === cert.content_id)
        : ebookList.find(e => e.id === cert.content_id);

      return {
        ...cert,
        course: content?.title || 'Conteúdo Removido',
        completedAt: new Date(cert.issue_date).toLocaleDateString('pt-BR'),
        hours: cert.custom_data?.hours || 10,
        code: cert.certificate_code,
        unlocked: true
      };
    });
  });
