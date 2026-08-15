import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendResendEmail } from "./resend.server";

/**
 * Camada de abstração para envio de e-mail através da Edge Function do Supabase.
 * Centraliza a lógica, validações e logs.
 */
export const sendEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    to: z.string().email(),
    template: z.enum([
      'boas_vindas',
      'acesso_liberado_produto',
      'conclusao_curso',
      'certificado_emitido',
      'novo_conteudo',
      'suporte_recebido'
    ]),
    data: z.record(z.any()).optional(),
    idempotencyKey: z.string().optional()
  }).parse(data))
  .handler(async ({ data: { to, template, data, idempotencyKey } }) => {
    try {
      // 1. Decidir se usa Resend direto ou via Edge Function
      // Por padrão, vamos usar a nova implementação direta com Resend API
      const result = await sendResendEmail({
        to,
        subject: data?.subject || `Notificação: ${template.replace(/_/g, ' ')}`,
        html: data?.html || `<h1>Notificação</h1><p>Template: ${template}</p><pre>${JSON.stringify(data, null, 2)}</pre>`,
        text: data?.text,
        tags: idempotencyKey ? [{ name: 'idempotency_key', value: idempotencyKey }] : undefined
      });

      return result;
    } catch (error: any) {
      console.error(`[Resend] Falha na abstração sendEmail:`, error);
      
      // Fallback para Edge Function se configurado ou se falhar o direto
      try {
        console.log(`[Resend] Tentando fallback para Edge Function...`);
        const { data: fallbackResult, error: fallbackError } = await supabase.functions.invoke('send-email', {
          body: { to, template, data, idempotency_key: idempotencyKey }
        });
        if (!fallbackError) return fallbackResult;
      } catch (e) {
        console.error(`[Resend] Fallback também falhou:`, e);
      }
      
      // Nunca propagar como exceção (quebra a UI). Retorna o erro tratado.
      return { success: false, error: error?.message ?? 'Falha ao enviar e-mail' };

    }
  });

export const getEmailLogs = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    limit: z.number().default(50),
    offset: z.number().default(0)
  }).parse(data))
  .handler(async ({ data: { limit, offset } }) => {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return data;
  });

export const getEmailSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('email_settings')
      .select('*')
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  });

export const validateSender = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    apiKey: z.string(),
    email: z.string().email()
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: userData.user.id, 
      _role: 'admin' 
    });

    if (!isAdmin) throw new Error("Forbidden: Admin access required");

    const { validateResendSender } = await import("./resend.server");
    const result = await validateResendSender(data.apiKey, data.email);
    
    // Update settings with validation result using admin client
    const { data: settings } = await supabaseAdmin.from('email_settings').select('id').maybeSingle();
    if (settings) {
      await supabaseAdmin.from('email_settings').update({
        validation_status: result.status,
        last_validation_at: new Date().toISOString(),
        validation_error: result.error
      }).eq('id', settings.id);
    }
    
    return result;
  });

export const updateEmailSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    from_name: z.string().min(2),
    from_email: z.string().email(),
    reply_to: z.string().email().optional().nullable(),
    is_enabled: z.boolean()
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: userData.user.id, 
      _role: 'admin' 
    });

    if (!isAdmin) throw new Error("Forbidden: Admin access required");

    let settings = await getEmailSettings();
    
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabaseAdmin
        .from('email_settings')
        .insert([{ ...data }])
        .select()
        .single();
      
      if (insertError) throw new Error(insertError.message);
      return { success: true };
    }

    const { error } = await supabaseAdmin
      .from('email_settings')
      .update(data)
      .eq('id', settings.id);

    if (error) throw new Error(error.message);
    
    try {
      const { getResendConfig, validateResendSender } = await import("./resend.server");
      const config = await getResendConfig();
      if (config.apiKey) {
        const result = await validateResendSender(config.apiKey, data.from_email);
        const currentSettings = await getEmailSettings();
        if (currentSettings) {
          await supabaseAdmin.from('email_settings').update({
            validation_status: result.status,
            last_validation_at: new Date().toISOString(),
            validation_error: result.error
          }).eq('id', currentSettings.id);
        }
      }
    } catch (e) {
      console.warn("Could not auto-validate sender:", e);
    }

    return { success: true };
  });
