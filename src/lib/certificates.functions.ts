import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Acesso negado: permissão de administrador necessária.");
}

export const getContentCertificate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    contentId: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // First try to find by content_id
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('content_certificates' as any)
      .select('*')
      .eq('content_id', data.contentId)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);

    if (!existing) {
      // Check if it's a course or ebook to set content_type
      const { data: course } = await supabaseAdmin
        .from('courses' as any)
        .select('id')
        .eq('id', data.contentId)
        .maybeSingle();
        
      const contentType = course ? 'course' : 'ebook';
      
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('content_certificates' as any)
        .insert({
          content_id: data.contentId,
          content_type: contentType,
        } as any)
        .select()
        .single();
      
      if (insertError) throw new Error(insertError.message);
      return inserted;
    }

    return existing;
  });

export const saveContentCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    content_id: z.string(),
    content_type: z.enum(['course', 'ebook']),
    template_id: z.string().nullable().optional(),
    is_enabled: z.boolean(),
    custom_text: z.string().nullable().optional(),
    min_progress_percentage: z.number().min(0).max(100),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { content_type, ...upsertData } = data;
    const { error } = await supabaseAdmin
      .from('content_certificates' as any)
      .upsert({ ...upsertData, content_type } as any, { onConflict: 'content_id' });

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const generateCertificateManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    student_id: z.string(),
    content_id: z.string(),
    content_type: z.enum(['course', 'ebook']),
    custom_data: z.record(z.any()).optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const certificateCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const { data: result, error } = await supabaseAdmin
      .from('certificates' as any)
      .insert({
        student_id: data.student_id,
        content_id: data.content_id,
        content_type: data.content_type,
        certificate_code: certificateCode,
        custom_data: data.custom_data || {},
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  });

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from('certificate_templates' as any)
      .select('*')
      .eq('is_active', true);
      
    if (error) throw new Error(error.message);
    return data;
  });
