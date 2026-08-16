import { createServerFn } from "@tanstack/react-start";
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

    const certs = (certificates || []) as any[];

    // Fetch related content details (courses/ebooks)
    const courseIds = certs.filter(c => c.content_type === 'course').map(c => c.content_id);
    const ebookIds = certs.filter(c => c.content_type === 'ebook').map(c => c.content_id);

    const [{ data: courses }, { data: ebooks }] = await Promise.all([
      courseIds.length > 0 
        ? supabaseAdmin.from('courses' as any).select('id, title').in('id', courseIds)
        : Promise.resolve({ data: [] as any[] }),
      ebookIds.length > 0
        ? supabaseAdmin.from('ebooks' as any).select('id, title').in('id', ebookIds)
        : Promise.resolve({ data: [] as any[] })
    ]);

    const courseList = (courses || []) as any[];
    const ebookList = (ebooks || []) as any[];

    // Format final data
    return certs.map(cert => {
      const content = cert.content_type === 'course' 
        ? courseList.find(c => c.id === cert.content_id)
        : ebookList.find(e => e.id === cert.content_id);

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
