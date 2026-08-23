import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getResendConfig() {
  const { data: settings } = await supabaseAdmin
    .from("email_settings")
    .select("*")
    .maybeSingle();

  // Se explicitamente desabilitado, lançamos erro, EXCETO se estivermos apenas configurando/validando
  // (a lógica de envio real chama esta função, então o check de is_enabled é importante)
  if (settings && settings.is_enabled === false) {
    // Nota: Deixamos o erro para o fluxo de envio real. 
    // Para fins de configuração, retornamos a config mesmo se is_enabled for false.
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
    const domain = email.split('@')[1]?.trim().toLowerCase();
    if (!domain) {
      throw new Error('E-mail remetente inválido.');
    }

    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && payload?.name === 'restricted_api_key') {
        return {
          status: 'pending',
          error: 'A chave possui somente permissão de envio. Não foi possível confirmar o domínio; faça um envio de teste.'
        };
      }
      throw new Error(payload?.message || `Erro API Resend: ${response.status}`);
    }

    const domains = Array.isArray(payload?.data) ? payload.data : [];
    const configuredDomain = domains.find((item: { name?: string }) => item?.name?.toLowerCase() === domain);
    if (!configuredDomain || configuredDomain.status !== 'verified') {
      return {
        status: 'error',
        error: `O domínio ${domain} não está verificado no Resend.`
      };
    }

    return {
      status: 'verified',
      message: `Domínio ${domain} validado no Resend.`
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

function sanitizeTag(value: string) {
  const clean = (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 250);
  return clean || 'na';
}

/** URL pública absoluta da logo circular usada nos e-mails. */
export const EMAIL_LOGO_URL =
  (process.env['SITE_URL']?.replace(/\/$/, '') || 'https://ronneinaveia.com.br') + '/email-logo.png';

/**
 * Adiciona o cabeçalho com a logo redonda da marca em todo e-mail enviado.
 * Usa tabela + border-radius (compatível com Gmail, Outlook e Apple Mail).
 */
function withBrandHeader(html: string, brandName: string) {
  if (!html || html.includes('email-logo.png')) return html;
  const header = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:28px 0;">
  <tr>
    <td align="center">
      <img src="${EMAIL_LOGO_URL}" width="88" height="88" alt="${brandName}"
        style="display:block;width:88px;height:88px;border-radius:50%;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />
      <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;letter-spacing:.5px;">${brandName}</div>
    </td>
  </tr>
</table>`;
  return `<div style="background:#0f0f10;">${header}</div>${html}`;
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
        html: withBrandHeader(params.html, config.fromName),

        text: params.text,
        reply_to: params.reply_to,
        // Resend só aceita letras ASCII, números, "_" e "-" em nome/valor de tag
        tags: params.tags?.map((t) => ({
          name: sanitizeTag(t.name),
          value: sanitizeTag(t.value)
        }))
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
      const friendlyMessage =
        isUnverifiedDomain
          ? 'Envio bloqueado: o domínio do remetente não está verificado no Resend. Verifique um domínio em resend.com/domains e configure o e-mail remetente com esse domínio nas Integrações.'
          : raw;
      if (isUnverifiedDomain) {
        await supabaseAdmin.from('email_settings').update({
          validation_status: 'error',
          validation_error: friendlyMessage,
          last_validation_at: new Date().toISOString()
        }).eq('from_email', config.fromEmail);
      }
      throw new Error(friendlyMessage);
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

