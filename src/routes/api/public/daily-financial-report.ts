import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
            .single();

          if (settingsError) throw settingsError;

          // 2. Determine date range
          const targetDate = date ? new Date(date) : new Date();
          if (!date) targetDate.setDate(targetDate.getDate() - 1);
          
          const dateStr = targetDate.toISOString().split('T')[0];
          const startOfDay = `${dateStr}T00:00:00.000Z`;
          const endOfDay = `${dateStr}T23:59:59.999Z`;

          // 3. Fetch Data from payments (more accurate than enrollments for finance)
          const { data: payments, error: paymentsError } = await supabase
            .from("payments")
            .select("*")
            .in("status", ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"])
            .gte("created_at", startOfDay)
            .lte("created_at", endOfDay);

          if (paymentsError) throw paymentsError;

          // Calculate metrics
          const totalRevenue = (payments || []).reduce((sum, p: any) => sum + Number(p.net_amount || 0), 0);
          const salesCount = (payments || []).length;
          const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
          
          // Cost calculation: Asaas fees are already deducted from net_amount usually, 
          // but we might have other costs in financial_costs
          const { data: costsData } = await supabase
            .from("financial_costs")
            .select("value");
          
          const dailyCosts = (costsData || []).reduce((sum, c: any) => sum + (Number(c.value) / 30), 0); // Pro-rated monthly costs
          const totalCosts = dailyCosts; 
          const netProfit = totalRevenue - totalCosts;
          const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

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

            const formattedDate = new Intl.DateTimeFormat('pt-BR').format(targetDate);
            const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

            const message = `📊 Relatório do dia — ${formattedDate}\n\n` +
              `💰 Faturamento: ${brl(totalRevenue)}\n` +
              `💸 Custos: ${brl(totalCosts)}\n` +
              `✅ Lucro: ${brl(netProfit)} (margem ${margin.toFixed(0)}%)\n` +
              `🧾 Vendas: ${salesCount} · Ticket médio: ${brl(avgTicket)}`;

            try {
              if (!recipient.email) {
                throw new Error("E-mail não configurado para este destinatário.");
              }

              const sendStatus = await sendReportEmail(recipient.email, `Relatório Financeiro Diário - ${formattedDate}`, message);
              
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

          if (preview) {
            const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
            const formattedDate = new Intl.DateTimeFormat('pt-BR').format(targetDate);
            
            const message = `📊 *PRÉ-VISUALIZAÇÃO — ${formattedDate}*\n` +
              `💰 Faturamento: ${brl(totalRevenue)}\n` +
              `💸 Custos: ${brl(totalCosts)}\n` +
              `✅ Lucro: ${brl(netProfit)} (margem ${margin.toFixed(0)}%)\n` +
              `🧾 Vendas: ${salesCount} · Ticket médio: ${brl(avgTicket)}\n\n` +
              `_Este é um rascunho. O envio real ocorrerá no horário configurado._`;
            
            return Response.json({ 
              success: true, 
              preview: true,
              data: {
                totalRevenue,
                totalCosts,
                netProfit,
                margin,
                salesCount,
                avgTicket,
                message
              }
            });
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

async function sendReportEmail(to: string, subject: string, content: string) {
  const supabase = supabaseAdmin;

  // 1. Get Email Settings
  const { data: emailSettings, error: settingsError } = await supabase
    .from("email_settings")
    .select("*")
    .maybeSingle();

  if (settingsError || !emailSettings || !emailSettings.is_enabled) {
    console.log(`[Email Fallback] Email desativado ou não configurado. Simulação para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Conteúdo: ${content}`);
    
    if (!emailSettings?.is_enabled) {
      throw new Error("Serviço de e-mail desativado. Vá em Integrações > E-mail.");
    }
  }

  // 2. Chamar a Edge Function de envio de e-mail (Resend)
  try {
    const { data: result, error: invokeError } = await supabase.functions.invoke('send-email', {
      body: { 
        to, 
        template: 'relatorio_financeiro',
        data: { 
          subject,
          content
        }
      }
    });

    if (invokeError) throw invokeError;
    return { id: result?.id || `email_msg_${Date.now()}` };
  } catch (err: any) {
    console.warn("[Resend] Falha ao invocar edge function 'send-email', tentando via server function interna...");
    
    // Tenta via lib interna se disponível (fallback para ambientes onde edge functions falham)
    try {
      const { triggerEmailEvent } = await import("@/lib/resend.server");
      const res = await triggerEmailEvent({
        event: 'relatorio_financeiro',
        to,
        data: { subject, content },
        idempotencyKey: `report_${to}_${new Date().toISOString().split('T')[0]}`
      });
      return { id: res?.id || `email_msg_${Date.now()}` };
    } catch (innerErr: any) {
      throw new Error(`Erro ao enviar e-mail: ${err.message}. Fallback também falhou: ${innerErr.message}`);
    }
  }
}

// Removendo função sendWhatsApp obsoleta

