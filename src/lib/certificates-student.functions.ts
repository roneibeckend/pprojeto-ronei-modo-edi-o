import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getStudentCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Fetch certificates for the authenticated user
    const { data: certificates, error: certError } = await supabaseAdmin
      .from('certificates' as any)
      .select(`
        *,
        template:certificate_templates(*)
      `)
      .eq('student_id', context.userId)
      .eq('is_revoked', false);

    if (certError) throw new Error(certError.message);

    // Fetch related content details (courses/ebooks)
    const courseIds = (certificates || []).filter(c => c.content_type === 'course').map(c => c.content_id);
    const ebookIds = (certificates || []).filter(c => c.content_type === 'ebook').map(c => c.content_id);

    const [{ data: courses }, { data: ebooks }] = await Promise.all([
      courseIds.length > 0 
        ? supabaseAdmin.from('courses' as any).select('id, title').in('id', courseIds)
        : Promise.resolve({ data: [] }),
      ebookIds.length > 0
        ? supabaseAdmin.from('ebooks' as any).select('id, title').in('id', ebookIds)
        : Promise.resolve({ data: [] })
    ]);

    // Format final data
    return (certificates || []).map(cert => {
      const content = cert.content_type === 'course' 
        ? courses?.find(c => c.id === cert.content_id)
        : ebooks?.find(e => e.id === cert.content_id);

      return {
        ...cert,
        course: content?.title || 'Conteúdo Removido',
        completedAt: new Date(cert.issue_date).toLocaleDateString('pt-BR'),
        hours: cert.custom_data?.hours || 10, // Fallback hours
        code: cert.certificate_code,
        unlocked: true
      };
    });
  });
