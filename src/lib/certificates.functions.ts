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

// ID validation - accepting UUID or slug-like strings
const isValidId = (str: string) => /^[a-z0-9-]+$/i.test(str);

export const getContentCertificate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => {
    const parsed = z.object({
      contentId: z.string().min(1, "ID de conteúdo é obrigatório."),
    }).parse(data);
    return parsed;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('content_certificates' as any)
      .select('*')
      .eq('content_id', data.contentId)
      .maybeSingle();

    if (fetchError) {
      console.error(`Error fetching certificate for content ${data.contentId}:`, fetchError);
      throw new Error("Erro ao buscar configuração de certificado.");
    }

    if (!existing) {
      // Determine content type safely
      let contentType: 'course' | 'ebook' = 'course';
      
      const { data: course } = await supabaseAdmin
        .from('courses' as any)
        .select('id')
        .eq('id', data.contentId)
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
        throw new Error("Erro ao inicializar configuração de certificado.");
      }
      return inserted;
    }

    return existing;
  });

export const saveContentCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => {
    const parsed = z.object({
      content_id: z.string().min(1, "ID de conteúdo é obrigatório."),
      content_type: z.enum(['course', 'ebook']),
      template_id: z.string().nullable().optional(),
      is_enabled: z.boolean(),
      custom_text: z.string().nullable().optional(),
      min_progress_percentage: z.number().min(0).max(100),
      city_of_issue: z.string().optional(),
    }).parse(data);
    return parsed;
  })
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
      throw new Error("Erro ao salvar configurações do certificado.");
    }
    return { success: true };
  });

export const generateCertificateManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    student_id: z.string().uuid("ID do aluno inválido."),
    content_id: z.string().min(1, "ID do conteúdo inválido."),
    content_type: z.enum(['course', 'ebook']),
    custom_data: z.record(z.any()).optional(),
    city_of_issue: z.string().optional(),
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
        city_of_issue: data.city_of_issue || 'Goiânia - Goiás',
      } as any)
      .select()
      .single();

    if (error) throw new Error("Erro ao gerar certificado manualmente.");
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
      
    if (error) throw new Error("Erro ao listar modelos de certificado.");
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

    if (error) throw new Error("Erro ao criar modelo de certificado.");
    return template;
  });

export const updateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string().uuid(),
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

    if (error) throw new Error("Erro ao atualizar modelo de certificado.");
    return template;
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from('certificate_templates' as any)
      .update({ is_active: false } as any)
      .eq('id', data.id);

    if (error) throw new Error("Erro ao remover modelo de certificado.");
    return { success: true };
  });
