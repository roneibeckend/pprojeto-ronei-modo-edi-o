import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
      // 1. Obter sessão para verificar se o chamador está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Chamar a Edge Function (será implementada via Supabase CLI ou similar)
      // Nota: A invocação direta usa o token da sessão do usuário se disponível
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: { to, template, data, idempotency_key: idempotencyKey }
      });

      if (error) {
        console.error(`[Resend] Erro ao enviar e-mail (${template}):`, error);
        throw new Error(error.message || "Erro ao processar envio de e-mail");
      }

      return result;
    } catch (error: any) {
      console.error(`[Resend] Falha na abstração sendEmail:`, error);
      throw error;
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
      .single();

    if (error) throw new Error(error.message);
    return data;
  });

export const updateEmailSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    from_name: z.string().min(2),
    from_email: z.string().email(),
    reply_to: z.string().email().optional().nullable(),
    is_enabled: z.boolean()
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from('email_settings')
      .update(data)
      .eq('id', (await getEmailSettings()).id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
