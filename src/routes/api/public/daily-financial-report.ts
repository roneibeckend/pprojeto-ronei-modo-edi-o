import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { collectDailyReport, renderDailyReportHtml, renderDailyReportText } from "@/lib/daily-report.server";

export const Route = createFileRoute("/api/public/daily-financial-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Security Check: Allow internal cron secret OR authenticated admin session
          const authHeader = request.headers.get("Authorization");
          const internalSecret = process.env["REPORT_INTERNAL_SECRET"];
          
          let isAuthorized = false;
          
          // 1. Check internal secret (from pg_cron)
          if (internalSecret && authHeader === `Bearer ${internalSecret}`) {
            isAuthorized = true;
          }
          
          // 2. Check for authenticated session (from UI preview/test)
          if (!isAuthorized && authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
            
            if (!authError && user) {
              // Verify if user is admin
              const { data: roleData } = await supabaseAdmin
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .eq("role", "admin")
                .maybeSingle();
                
              if (roleData) {
                isAuthorized = true;
              }
            }
          }

          if (!isAuthorized) {
            return new Response("Não autorizado", { status: 401 });
          }

          const { recipient_id, date, test, preview } = (await request.json().catch(() => ({}))) || {};

          const supabase = supabaseAdmin;

          // 1. Get Settings
          const { data: settings, error: settingsError } = await supabase
            .from("report_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (settingsError) throw settingsError;
          if (!settings) {
            console.log("Configurações de relatório não encontradas. Usando padrões.");
          }

          // 2/3. Coletar todas as métricas do dia (financeiro, alunos, afiliados, suporte, sistema)
          const report = await collectDailyReport(date);
          const { dateStr, formattedDate } = report;

          // Pré-visualização: nunca envia e-mail
          if (preview) {
            return Response.json({
              success: true,
              preview: true,
              data: {
                ...report,
                message: renderDailyReportText(report),
                html: renderDailyReportHtml(report)
              }
            });
          }

          // 4. Get Recipients
          let query = supabase.from("report_recipients").select("*").eq("active", true);
          if (recipient_id) query = query.eq("id", recipient_id);
          
          const { data: recipients, error: recipientsError } = await query;
          if (recipientsError) throw recipientsError;


          // 5. Send Email
          const results = [];
          for (const recipient of recipients || []) {
            if (!test) {
              const { data: existing } = await supabase
                .from("report_logs")
                .select("id")
                .eq("recipient_id", recipient.id)
                .eq("report_date", dateStr)
                .eq("status", "sent")
                .single();
              
              if (existing) {
                results.push({ recipient: recipient.name, status: "skipped", reason: "already sent" });
                continue;
              }
            }

            const message = renderDailyReportText(report);
            const html = renderDailyReportHtml(report);

            try {
              if (!recipient.email) {
                throw new Error("E-mail não configurado para este destinatário.");
              }

              const sendStatus = await sendReportEmail(recipient.email, `Relatório Diário - ${formattedDate}`, html, message);
              
              await supabase.from("report_logs").insert({
                recipient_id: recipient.id,
                report_date: dateStr,
                status: "sent",
                provider_message_id: sendStatus.id
              });
              
              results.push({ recipient: recipient.name, status: "sent" });
            } catch (err: any) {
              await supabase.from("report_logs").insert({
                recipient_id: recipient.id,
                report_date: dateStr,
                status: "failed",
                error: err.message
              });
              results.push({ recipient: recipient.name, status: "failed", error: err.message });
            }
          }




          return Response.json({ success: true, results });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      },
    },
  },
});

async function sendReportEmail(to: string, subject: string, html: string, text: string) {
  const supabase = supabaseAdmin;

  // 1. Get Email Settings
  const { data: emailSettings, error: settingsError } = await supabase
    .from("email_settings")
    .select("*")
    .maybeSingle();

  if (settingsError || !emailSettings || !emailSettings.is_enabled) {
    console.log(`[Email Fallback] Email desativado ou não configurado. Simulação para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Conteúdo: ${text}`);
    
    if (!emailSettings?.is_enabled) {
      throw new Error("Serviço de e-mail desativado. Vá em Integrações > E-mail.");
    }
  }

  // 2. Enviar via Resend (server function interna)
  const { sendResendEmail } = await import("@/lib/resend.server");
  const res = await sendResendEmail({
    to,
    subject,
    html,
    text,
    tags: [{ name: 'event', value: 'relatorio_diario' }]
  });
  return { id: res?.id || `email_msg_${Date.now()}` };
}

// Removendo função sendWhatsApp obsoleta

