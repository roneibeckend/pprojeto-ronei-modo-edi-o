import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/daily-financial-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Security Check
          const authHeader = request.headers.get("Authorization");
          const internalSecret = process.env["REPORT_INTERNAL_SECRET"];
          
          if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
            return new Response("Unauthorized", { status: 401 });
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

          // 3. Fetch Data
          const { data: sales, error: salesError } = await supabase
            .from("course_enrollments")
            .select("*, courses(price)")
            .gte("created_at", startOfDay)
            .lte("created_at", endOfDay);

          if (salesError) throw salesError;

          // Calculate metrics
          const totalRevenue = (sales || []).reduce((sum, sale: any) => sum + (sale.courses?.price || 0), 0);
          const salesCount = (sales || []).length;
          const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
          
          // Cost calculation (simplified as per plan)
          const platformFees = totalRevenue * 0.1; 
          const estimatedCosts = 0; // Future enhancement: fetch from settings or expenses table
          const totalCosts = platformFees + estimatedCosts;
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

async function sendWhatsApp(phone: string, message: string) {
  const supabase = supabaseAdmin;

  // 1. Verificar se há uma instância conectada
  const { data: instance, error } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000000")
    .single();

  if (error || !instance || instance.status !== 'connected') {
    // Se não estiver conectado, usamos o comportamento de fallback/mock para não quebrar a demo
    console.log(`[WhatsApp Fallback] Instância não conectada. Simulação para: ${phone}`);
    console.log(`Mensagem: ${message}`);
    
    if (!instance || instance.status !== 'connected') {
      throw new Error("WhatsApp não conectado. Vá em Relatórios > Conexão WhatsApp.");
    }
  }

  // Aqui integraríamos com o provedor real (ex: Evolution API) usando session_data
  // Por enquanto, como o ambiente Lovable foca em TanStack Start e não tem servidor node fixo
  // para manter sessões Baileys/Puppeteer, simulamos o sucesso do envio da instância conectada.
  
  console.log(`[WhatsApp Instance ${instance.id}] Enviando para ${phone}...`);
  
  return { id: `wa_msg_${Date.now()}` };
}
