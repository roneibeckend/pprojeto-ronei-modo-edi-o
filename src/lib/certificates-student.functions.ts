import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    content_id: z.string(),
    content_type: z.enum(['course', 'ebook']),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('certificates' as any)
      .select('id' as any)
      .eq('student_id', context.userId)
      .eq('content_id', data.content_id)
      .maybeSingle();
      
    if (existing) return { success: true, certificate_id: (existing as any).id };

    // Get certificate configuration to check if it's enabled
    const { data: config } = await supabaseAdmin
      .from('content_certificates' as any)
      .select('*' as any)
      .filter('content_id', 'eq', data.content_id)
      .maybeSingle();

    if (config && (config as any).is_enabled === false) {
      throw new Error("Certificado não está habilitado para este conteúdo.");
    }

    const certificateCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const { data: result, error } = await supabaseAdmin
      .from('certificates' as any)
      .insert({
        student_id: context.userId,
        content_id: data.content_id,
        content_type: data.content_type,
        certificate_code: certificateCode,
        issue_date: new Date().toISOString(),
        template_id: (config as any)?.template_id,
        custom_data: {
          hours: (config as any)?.min_progress_percentage === 100 ? 40 : 10,
          text: (config as any)?.custom_text
        }
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, certificate_id: (result as any).id };
  });


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
