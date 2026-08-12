import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getResendConfig() {
  const { data: integration, error } = await supabaseAdmin
    .from("integrations")
    .select("*")
    .eq("category", "resend")
    .eq("status", true)
    .single();

  if (error || !integration) {
    // If not found in integrations table, try environment variable as fallback
    const envApiKey = process.env['RESEND_API_KEY'];
    if (envApiKey) {
      return {
        apiKey: envApiKey,
        fromEmail: process.env['RESEND_FROM_EMAIL'] || 'onboarding@resend.dev',
        fromName: process.env['RESEND_FROM_NAME'] || 'Plataforma'
      };
    }
    throw new Error("Integração com Resend não está configurada ou ativa.");
  }

  const credentials = (integration.credentials || {}) as Record<string, string>;
  const settings = (integration.settings || {}) as Record<string, any>;
  const apiKey = credentials.apiKey;

  if (!apiKey) {
    throw new Error("Chave de API do Resend ausente nas configurações.");
  }

  return {
    apiKey,
    fromEmail: settings.fromEmail || 'onboarding@resend.dev',
    fromName: settings.fromName || 'Plataforma'
  };
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
      throw new Error(data.message || `Erro ${response.status} ao enviar email via Resend`);
    }

    // Log the email attempt in a central table if it exists
    try {
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        template_name: params.subject, // We use subject as template name if not provided
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
    
    // Log failure
    try {
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        template_name: params.subject,
        status: 'error',
        error_message: error.message
      });
    } catch (logError) {
      // Silently fail logging if it crashes
    }
    
    throw error;
  }
}
