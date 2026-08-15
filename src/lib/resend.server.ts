import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getResendConfig() {
  const { data: settings } = await supabaseAdmin
    .from("email_settings")
    .select("*")
    .maybeSingle();

  if (settings && settings.is_enabled === false) {
    throw new Error("O envio de e-mails está desativado nas configurações de Identidade do Remetente.");
  }

  const { data: integration, error } = await supabaseAdmin
    .from("integrations")
    .select("*")
    .eq("category", "resend")
    .eq("status", true)
    .maybeSingle();

  if (error || !integration) {
    const envApiKey = process.env['RESEND_API_KEY'];
    if (envApiKey) {
      return {
        apiKey: envApiKey,
        fromEmail: settings?.from_email || process.env['RESEND_FROM_EMAIL'] || 'onboarding@resend.dev',
        fromName: settings?.from_name || process.env['RESEND_FROM_NAME'] || 'Plataforma'
      };
    }
    throw new Error("Integração com Resend não está configurada ou ativa.");
  }

  const credentials = (integration.credentials || {}) as Record<string, string>;
  const apiKey = credentials.apiKey;

  if (!apiKey) {
    throw new Error("Chave de API do Resend ausente nas configurações.");
  }

  return {
    apiKey,
    fromEmail: settings?.from_email || (integration.settings as any)?.fromEmail || 'onboarding@resend.dev',
    fromName: settings?.from_name || (integration.settings as any)?.fromName || 'Plataforma'
  };
}

export async function validateResendSender(apiKey: string, email: string) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'test@resend.dev',
        subject: 'Validation',
        html: 'Validation',
        dry_run: true
      })
    });

    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      if (data.name === 'restricted_api_key') {
         return {
           status: 'verified',
           message: 'Chave de API validada com sucesso (Restrita a envio).'
         };
      }
      throw new Error(`Chave de API Inválida (401)`);
    }

    if (!response.ok) {
      throw new Error(`Erro API Resend: ${response.status}`);
    }

    return {
      status: 'verified',
      message: 'Chave de API validada com sucesso.'
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

export async function sendResendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
  tags?: { name: string; value: string }[];
}) {
  try {
    const config = await getResendConfig();
    const from = params.from || `${config.fromName} <${config.fromEmail}>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.reply_to,
        tags: params.tags
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Resend] Erro na API:', data);
      const raw: string = data?.message || `Erro ${response.status} ao enviar email via Resend`;
      // Domínio não verificado: o remetente de teste (onboarding@resend.dev) só entrega
      // para o e-mail do dono da conta. Mensagem clara para o admin resolver.
      const isUnverifiedDomain =
        response.status === 403 || /testing emails|verify a domain/i.test(raw);
      throw new Error(
        isUnverifiedDomain
          ? 'Envio bloqueado: o domínio do remetente não está verificado no Resend. Verifique um domínio em resend.com/domains e configure o e-mail remetente com esse domínio nas Integrações.'
          : raw
      );
    }


    try {
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        template_name: params.subject,
        status: 'sent',
        provider_message_id: data.id,
        payload: { tags: params.tags } as any
      });
    } catch (logError) {
      console.warn('[Resend] Falha ao logar envio de email:', logError);
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('[Resend] Erro ao enviar email:', error);
    try {
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        template_name: params.subject,
        status: 'error',
        error_message: error.message
      });
    } catch (logError) {}
    throw error;
  }
}

/**
 * Replace variables in a template string.
 * Example: "Hello {{name}}" + {name: "John"} -> "Hello John"
 */
function renderTemplate(content: string, variables: Record<string, any>) {
  return content.replace(/\{\{(.+?)\}\}/g, (match, key) => {
    const cleanKey = key.trim();
    return variables[cleanKey] !== undefined ? variables[cleanKey] : match;
  });
}

/**
 * Triggers an automated email based on a template name.
 */
export async function triggerEmailEvent(params: {
  event: string;
  to: string;
  data: Record<string, any>;
  idempotencyKey?: string;
}) {
  console.log(`[Email] Disparando evento: ${params.event} para ${params.to}`);
  
  try {
    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('name', params.event)
      .maybeSingle();

    if (error || !template) {
      console.warn(`[Email] Template não encontrado para o evento: ${params.event}. Usando fallback.`);
      // Generic fallback logic if template is missing
      return await sendResendEmail({
        to: params.to,
        subject: params.data.subject || `Notificação: ${params.event}`,
        html: `<p>Notificação de sistema para o evento: ${params.event}</p>`,
        tags: params.idempotencyKey ? [{ name: 'idempotency_key', value: params.idempotencyKey }] : undefined
      });
    }

    const renderedSubject = renderTemplate(template.subject, params.data);
    const renderedHtml = renderTemplate(template.content_html, params.data);
    const renderedText = template.content_text ? renderTemplate(template.content_text, params.data) : undefined;

    return await sendResendEmail({
      to: params.to,
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText,
      tags: [
        { name: 'event', value: params.event },
        ...(params.idempotencyKey ? [{ name: 'idempotency_key', value: params.idempotencyKey }] : [])
      ]
    });
  } catch (err: any) {
    console.error(`[Email] Falha ao disparar evento ${params.event}:`, err);
    throw err;
  }
}

