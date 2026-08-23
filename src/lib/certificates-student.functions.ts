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
      .filter('content_id', 'eq', data.content_id)
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

    // If it's an ebook, check for linked course and complete it
    if (data.content_type === 'ebook') {
      try {
        await supabaseAdmin.rpc('complete_linked_course', {
          _ebook_id: data.content_id,
          _user_id: context.userId
        });
      } catch (e) {
        console.error("Erro ao completar curso vinculado:", e);
      }
    }

    const certificateCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const { estimateContentHours } = await import("@/lib/certificate-hours.server");
    const estimatedHours = await estimateContentHours(data.content_id, data.content_type);

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
          hours: estimatedHours,
          text: (config as any)?.custom_text
        },
        city_of_issue: (config as any)?.city_of_issue || 'Goiânia - Goiás'
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

    const { data: profile } = await supabaseAdmin
      .from('profiles' as any)
      .select('name')
      .eq('id', context.userId)
      .maybeSingle();


    const courseIds = certs.filter(c => c.content_type === 'course').map(c => c.content_id);
    const ebookIds = certs.filter(c => c.content_type === 'ebook').map(c => c.content_id);

    const [courseRes, ebookRes] = await Promise.all([
      courseIds.length > 0 
        ? supabaseAdmin.from('courses' as any).select('id, title').filter('id', 'in', `(${courseIds.join(',')})`)
        : Promise.resolve({ data: [] as any[] }),
      ebookIds.length > 0
        ? supabaseAdmin.from('ebooks' as any).select('id, title').filter('id', 'in', `(${ebookIds.join(',')})`)
        : Promise.resolve({ data: [] as any[] })
    ]);

    const courseList = (courseRes.data || []) as any[];
    const ebookList = (ebookRes.data || []) as any[];

    const { estimateContentHours } = await import("@/lib/certificate-hours.server");

    return await Promise.all(certs.map(async (cert) => {
      const content = cert.content_type === 'course' 
        ? courseList.find(c => c.id === cert.content_id)
        : ebookList.find(e => e.id === cert.content_id);

      const hours = await estimateContentHours(cert.content_id, cert.content_type);

      return {
        ...cert,
        student_name: (profile as any)?.name || 'Aluno',
        course: content?.title || 'Conteúdo Removido',
        completedAt: new Date(cert.issue_date).toLocaleDateString('pt-BR'),
        hours,
        code: cert.certificate_code,
        unlocked: true
      };
    }));
  });
