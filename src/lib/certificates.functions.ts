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
    
    // Use maybeSingle and validate the id if necessary
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('content_certificates' as any)
      .select('*')
      .filter('content_id', 'eq', data.contentId)
      .maybeSingle();

    if (fetchError) {
      console.error(`Error fetching certificate for content ${data.contentId}:`, fetchError);
      throw new Error(fetchError.message);
    }

    if (!existing) {
      // Determine content type safely
      let contentType: 'course' | 'ebook' = 'course';
      
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses' as any)
        .select('id')
        .filter('id', 'eq', data.contentId)
        .maybeSingle();
        
      if (!course) {
        contentType = 'ebook';
      }
      
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('content_certificates' as any)
        .insert({
          content_id: data.contentId,
          content_type: contentType,
          is_enabled: false,
          min_progress_percentage: 100
        } as any)
        .select()
        .single();
      
      if (insertError) {
        console.error(`Error creating certificate for content ${data.contentId}:`, insertError);
        throw new Error(insertError.message);
      }
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
    
    const { content_id, content_type, ...upsertData } = data;
    const { error } = await supabaseAdmin
      .from('content_certificates' as any)
      .upsert({ 
        ...upsertData, 
        content_id, 
        content_type 
      } as any, { 
        onConflict: 'content_id' 
      });

    if (error) {
      console.error(`Error saving certificate for content ${content_id}:`, error);
      throw new Error(error.message);
    }
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
      .order('created_at', { ascending: false });
      
    if (error) throw new Error(error.message);
    return data;
  });

export const createTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    name: z.string(),
    background_url: z.string().optional(),
    is_default: z.boolean().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: template, error } = await supabaseAdmin
      .from('certificate_templates' as any)
      .insert({
        ...data,
        is_active: true,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return template;
  });

export const updateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string(),
    name: z.string().optional(),
    background_url: z.string().optional(),
    is_active: z.boolean().optional(),
    is_default: z.boolean().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { id, ...updateData } = data;
    const { data: template, error } = await supabaseAdmin
      .from('certificate_templates' as any)
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return template;
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from('certificate_templates' as any)
      .update({ is_active: false } as any)
      .eq('id', data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
