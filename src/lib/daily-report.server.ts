import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface DailyReportData {
  dateStr: string;
  formattedDate: string;
  totalRevenue: number;
  grossRevenue: number;
  totalFees: number;
  totalCosts: number;
  netProfit: number;
  margin: number;
  salesCount: number;
  avgTicket: number;
  byBillingType: { type: string; count: number; value: number }[];
  pendingPayments: { count: number; value: number };
  newStudents: number;
  courseEnrollments: number;
  ebookEnrollments: number;
  affiliateSales: { count: number; commission: number };
  payoutsPending: { count: number; value: number };
  payoutsPaid: { count: number; value: number };
  tickets: { created: number; open: number; closed: number };
  leads: number;
  abandonedCheckouts: number;
  errors: { count: number; samples: { source: string; message: string }[] };
  emails: { sent: number; failed: number };
}

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export async function collectDailyReport(date?: string): Promise<DailyReportData> {
  const supabase = supabaseAdmin;

  const targetDate = date ? new Date(`${date}T12:00:00.000Z`) : new Date();
  if (!date) targetDate.setDate(targetDate.getDate() - 1);
  const dateStr = targetDate.toISOString().split("T")[0];
  const start = `${dateStr}T00:00:00.000Z`;
  const end = `${dateStr}T23:59:59.999Z`;

  const paid = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];

  const [
    paymentsRes,
    pendingRes,
    costsRes,
    profilesRes,
    courseEnrRes,
    ebookEnrRes,
    afSalesRes,
    payoutsRes,
    ticketsRes,
    openTicketsRes,
    leadsRes,
    pendingCheckoutsRes,
    logsRes,
    emailLogsRes,
  ] = await Promise.all([
    supabase.from("payments").select("amount, net_amount, fee, billing_type, status").in("status", paid).gte("created_at", start).lte("created_at", end),
    supabase.from("payments").select("amount").eq("status", "PENDING").gte("created_at", start).lte("created_at", end),
    supabase.from("financial_costs").select("value"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    supabase.from("course_enrollments").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    supabase.from("ebook_enrollments").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    supabase.from("affiliate_sales").select("commission").gte("created_at", start).lte("created_at", end),
    supabase.from("payout_requests").select("amount, status, created_at, updated_at"),
    supabase.from("support_tickets").select("status, closed_at, created_at").gte("created_at", start).lte("created_at", end),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "aberto", "pending", "in_progress"]),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    supabase.from("pending_checkouts").select("id", { count: "exact", head: true }).eq("status", "pending").gte("created_at", start).lte("created_at", end),
    supabase.from("system_logs").select("source, message, level").eq("level", "error").gte("created_at", start).lte("created_at", end).limit(200),
    supabase.from("email_logs").select("status").gte("created_at", start).lte("created_at", end).limit(1000),
  ]);

  const payments = paymentsRes.data || [];
  const grossRevenue = payments.reduce((s, p: any) => s + Number(p.amount || 0), 0);
  const totalFees = payments.reduce((s, p: any) => s + Number(p.fee || 0), 0);
  const totalRevenue = payments.reduce(
    (s, p: any) => s + Number(p.net_amount ?? p.amount ?? 0),
    0,
  );
  const salesCount = payments.length;
  const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0;

  const byMap = new Map<string, { count: number; value: number }>();
  for (const p of payments as any[]) {
    const key = p.billing_type || "OUTRO";
    const cur = byMap.get(key) || { count: 0, value: 0 };
    cur.count += 1;
    cur.value += Number(p.net_amount ?? p.amount ?? 0);
    byMap.set(key, cur);
  }

  const dailyCosts = (costsRes.data || []).reduce((s, c: any) => s + Number(c.value || 0) / 30, 0);
  const netProfit = totalRevenue - dailyCosts;

  const payouts = (payoutsRes.data || []) as any[];
  const payoutsPendingList = payouts.filter((p) =>
    ["pending", "pendente", "em_analise", "approved", "aprovado"].includes(String(p.status)),
  );
  const payoutsPaidList = payouts.filter(
    (p) => ["paid", "pago"].includes(String(p.status)) && String(p.updated_at || "").startsWith(dateStr),
  );

  const ticketsDay = (ticketsRes.data || []) as any[];
  const errorRows = (logsRes.data || []) as any[];
  const emailRows = (emailLogsRes.data || []) as any[];

  return {
    dateStr,
    formattedDate: new Intl.DateTimeFormat("pt-BR").format(targetDate),
    totalRevenue,
    grossRevenue,
    totalFees,
    totalCosts: dailyCosts,
    netProfit,
    margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    salesCount,
    avgTicket,
    byBillingType: [...byMap.entries()].map(([type, v]) => ({ type, ...v })),
    pendingPayments: {
      count: (pendingRes.data || []).length,
      value: (pendingRes.data || []).reduce((s, p: any) => s + Number(p.amount || 0), 0),
    },
    newStudents: profilesRes.count || 0,
    courseEnrollments: courseEnrRes.count || 0,
    ebookEnrollments: ebookEnrRes.count || 0,
    affiliateSales: {
      count: (afSalesRes.data || []).length,
      commission: (afSalesRes.data || []).reduce((s, a: any) => s + Number(a.commission || 0), 0),
    },
    payoutsPending: {
      count: payoutsPendingList.length,
      value: payoutsPendingList.reduce((s, p) => s + Number(p.amount || 0), 0),
    },
    payoutsPaid: {
      count: payoutsPaidList.length,
      value: payoutsPaidList.reduce((s, p) => s + Number(p.amount || 0), 0),
    },
    tickets: {
      created: ticketsDay.length,
      open: openTicketsRes.count || 0,
      closed: ticketsDay.filter((t) => t.closed_at).length,
    },
    leads: leadsRes.count || 0,
    abandonedCheckouts: pendingCheckoutsRes.count || 0,
    errors: {
      count: errorRows.length,
      samples: errorRows.slice(0, 5).map((e) => ({
        source: e.source || "sistema",
        message: String(e.message || "").slice(0, 160),
      })),
    },
    emails: {
      sent: emailRows.filter((e) => e.status === "sent").length,
      failed: emailRows.filter((e) => e.status !== "sent").length,
    },
  };
}

export function renderDailyReportText(d: DailyReportData) {
  return [
    `Relatorio diario - ${d.formattedDate}`,
    ``,
    `FINANCEIRO`,
    `Faturamento liquido: ${brl(d.totalRevenue)} (bruto ${brl(d.grossRevenue)}, taxas ${brl(d.totalFees)})`,
    `Custos rateados: ${brl(d.totalCosts)}`,
    `Lucro: ${brl(d.netProfit)} (margem ${d.margin.toFixed(0)}%)`,
    `Vendas: ${d.salesCount} | Ticket medio: ${brl(d.avgTicket)}`,
    `Pagamentos pendentes: ${d.pendingPayments.count} (${brl(d.pendingPayments.value)})`,
    ``,
    `ALUNOS`,
    `Novos cadastros: ${d.newStudents} | Matriculas cursos: ${d.courseEnrollments} | eBooks: ${d.ebookEnrollments}`,
    `Leads: ${d.leads} | Checkouts abandonados: ${d.abandonedCheckouts}`,
    ``,
    `AFILIADOS`,
    `Vendas: ${d.affiliateSales.count} | Comissoes: ${brl(d.affiliateSales.commission)}`,
    `Saques pendentes: ${d.payoutsPending.count} (${brl(d.payoutsPending.value)}) | Pagos hoje: ${d.payoutsPaid.count} (${brl(d.payoutsPaid.value)})`,
    ``,
    `SUPORTE E SISTEMA`,
    `Tickets criados: ${d.tickets.created} | Abertos: ${d.tickets.open} | Encerrados: ${d.tickets.closed}`,
    `E-mails enviados: ${d.emails.sent} | Falhas: ${d.emails.failed}`,
    `Erros registrados: ${d.errors.count}`,
  ].join("\n");
}

export function renderDailyReportHtml(d: DailyReportData) {
  const card = (label: string, value: string, accent = "#f97316") => `
    <td style="padding:8px;">
      <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:14px;">
        <div style="font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.6px;">${label}</div>
        <div style="font-size:20px;font-weight:700;color:${accent};margin-top:6px;">${value}</div>
      </div>
    </td>`;

  const section = (title: string, rows: string) => `
    <h2 style="font-size:14px;color:#f97316;text-transform:uppercase;letter-spacing:1px;margin:28px 0 10px;">${title}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;

  const line = (label: string, value: string) => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #27272a;color:#d4d4d8;font-size:14px;">${label}</td>
      <td align="right" style="padding:9px 0;border-bottom:1px solid #27272a;color:#ffffff;font-size:14px;font-weight:600;">${value}</td>
    </tr>`;

  const billing = d.byBillingType.length
    ? d.byBillingType.map((b) => line(b.type, `${b.count} · ${brl(b.value)}`)).join("")
    : line("Sem vendas no período", "—");

  const errors = d.errors.samples.length
    ? d.errors.samples
        .map((e) => line(`<span style="color:#f87171;">${e.source}</span>`, `<span style="font-weight:400;font-size:12px;">${e.message}</span>`))
        .join("")
    : line("Nenhum erro registrado", "✅");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0f0f10;">
  <div style="display:none;max-height:0;overflow:hidden;">Faturamento ${brl(d.totalRevenue)} · ${d.salesCount} vendas · ${d.formattedDate}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f10;padding:0 0 32px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:94%;font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="padding:24px 8px 0;">
          <h1 style="color:#ffffff;font-size:22px;margin:0;">Relatório Diário</h1>
          <p style="color:#a1a1aa;font-size:13px;margin:6px 0 0;">Referência: ${d.formattedDate}</p>
        </td></tr>
        <tr><td style="padding-top:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>${card("Faturamento líquido", brl(d.totalRevenue))}${card("Vendas", String(d.salesCount), "#ffffff")}</tr>
            <tr>${card("Lucro estimado", brl(d.netProfit), d.netProfit >= 0 ? "#22c55e" : "#f87171")}${card("Ticket médio", brl(d.avgTicket), "#ffffff")}</tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 8px;">
          ${section("Financeiro", [
            line("Receita bruta", brl(d.grossRevenue)),
            line("Taxas do gateway", brl(d.totalFees)),
            line("Custos rateados (mensal/30)", brl(d.totalCosts)),
            line("Margem", `${d.margin.toFixed(0)}%`),
            line("Pagamentos pendentes", `${d.pendingPayments.count} · ${brl(d.pendingPayments.value)}`),
          ].join(""))}
          ${section("Vendas por forma de pagamento", billing)}
          ${section("Alunos e aquisição", [
            line("Novos cadastros", String(d.newStudents)),
            line("Matrículas em cursos", String(d.courseEnrollments)),
            line("Acessos a eBooks", String(d.ebookEnrollments)),
            line("Leads captados", String(d.leads)),
            line("Checkouts não concluídos", String(d.abandonedCheckouts)),
          ].join(""))}
          ${section("Afiliados", [
            line("Vendas por afiliados", String(d.affiliateSales.count)),
            line("Comissões geradas", brl(d.affiliateSales.commission)),
            line("Saques aguardando", `${d.payoutsPending.count} · ${brl(d.payoutsPending.value)}`),
            line("Saques pagos no dia", `${d.payoutsPaid.count} · ${brl(d.payoutsPaid.value)}`),
          ].join(""))}
          ${section("Suporte", [
            line("Tickets criados", String(d.tickets.created)),
            line("Tickets em aberto", String(d.tickets.open)),
            line("Tickets encerrados", String(d.tickets.closed)),
          ].join(""))}
          ${section("Saúde do sistema", [
            line("E-mails enviados", String(d.emails.sent)),
            line("Falhas de e-mail", String(d.emails.failed)),
            line("Erros registrados", String(d.errors.count)),
            errors,
          ].join(""))}
          <p style="color:#71717a;font-size:11px;margin-top:28px;">Relatório automático gerado pela plataforma. Custos são rateados a partir dos custos fixos mensais cadastrados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
