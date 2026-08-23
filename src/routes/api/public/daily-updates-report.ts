import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { collectUpdatesReport, renderUpdatesReportEmail } from "@/lib/updates-report.server";

export const Route = createFileRoute("/api/public/daily-updates-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const internalSecret = process.env["REPORT_INTERNAL_SECRET"];
          let isAuthorized = false;

          if (internalSecret && authHeader === `Bearer ${internalSecret}`) isAuthorized = true;

          if (!isAuthorized && authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            const { data: tokenRow } = await supabaseAdmin
              .from("report_settings")
              .select("cron_token")
              .limit(1)
              .maybeSingle();
            if (tokenRow?.cron_token && token === tokenRow.cron_token) isAuthorized = true;
          }

          if (!isAuthorized && authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const {
              data: { user },
              error: authError,
            } = await supabaseAdmin.auth.getUser(token);
            if (!authError && user) {
              const { data: roleData } = await supabaseAdmin
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .eq("role", "admin")
                .maybeSingle();
              if (roleData) isAuthorized = true;
            }
          }

          if (!isAuthorized) return new Response("Não autorizado", { status: 401 });

          const { recipient_id, date, test, preview } =
            (await request.json().catch(() => ({}))) || ({} as any);

          const report = await collectUpdatesReport(date);
          const rendered = renderUpdatesReportEmail(report);

          if (preview) {
            return Response.json({
              success: true,
              preview: true,
              data: { ...report, html: rendered.html, message: rendered.text, subject: rendered.subject },
            });
          }

          const { data: settings } = await supabaseAdmin
            .from("report_settings")
            .select("enabled")
            .limit(1)
            .maybeSingle();

          if (!test && settings && settings.enabled === false) {
            return Response.json({ success: true, skipped: "reports disabled", results: [] });
          }

          // Sem atualizações no dia: não envia e-mail automático (apenas testes)
          if (!test && report.updates.length === 0) {
            return Response.json({ success: true, skipped: "no updates today", results: [] });
          }

          let query = supabaseAdmin.from("report_recipients").select("*").eq("active", true);
          if (recipient_id) query = query.eq("id", recipient_id);
          const { data: recipients, error: recipientsError } = await query;
          if (recipientsError) throw recipientsError;

          const results: any[] = [];
          for (const recipient of recipients || []) {
            if (!test) {
              const { data: existing } = await supabaseAdmin
                .from("update_report_logs")
                .select("id")
                .eq("recipient_id", recipient.id)
                .eq("report_date", report.dateStr)
                .eq("status", "sent")
                .maybeSingle();
              if (existing) {
                results.push({ recipient: recipient.name, status: "skipped", reason: "already sent" });
                continue;
              }
            }

            try {
              if (!recipient.email) throw new Error("E-mail não configurado para este destinatário.");

              const subject = test
                ? `[TESTE ${new Intl.DateTimeFormat("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  }).format(new Date())}] ${rendered.subject}`
                : rendered.subject;

              const { sendResendEmail } = await import("@/lib/resend.server");
              const res = await sendResendEmail({
                to: recipient.email,
                subject,
                html: rendered.html,
                text: rendered.text,
                tags: [{ name: "event", value: "relatorio_atualizacoes" }],
              });

              await supabaseAdmin.from("update_report_logs").insert({
                recipient_id: recipient.id,
                recipient_email: recipient.email,
                report_date: report.dateStr,
                status: "sent",
                provider_message_id: res?.id || null,
                updates_count: report.updates.length,
              });

              results.push({ recipient: recipient.name, status: "sent" });
            } catch (err: any) {
              await supabaseAdmin.from("update_report_logs").insert({
                recipient_id: recipient.id,
                recipient_email: recipient.email || null,
                report_date: report.dateStr,
                status: "failed",
                error: err.message,
                updates_count: report.updates.length,
              });
              results.push({ recipient: recipient.name, status: "failed", error: err.message });
            }
          }

          return Response.json({ success: true, results });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
