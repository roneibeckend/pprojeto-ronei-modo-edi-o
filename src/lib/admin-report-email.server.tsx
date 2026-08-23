import { render } from "@react-email/render";
import { BRAND } from "@/emails/layout";
import {
  AdminReportEmail,
  type AdminReportAlert,
  type AdminReportEmailProps,
} from "@/emails/AdminReport";
import type { AdminReportData } from "@/lib/admin-report.server";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v || 0);

function buildAlerts(d: AdminReportData): AdminReportAlert[] {
  const alerts: AdminReportAlert[] = [];

  if (d.errors.count > 0) {
    alerts.push({
      level: d.errors.count >= 10 ? "critical" : "warning",
      title: `${d.errors.count} erro(s) de sistema registrados`,
      detail: d.errors.samples.map((e) => `${e.source}: ${e.message}`).slice(0, 3).join(" | "),
    });
  }
  if (d.emails.failed > 0) {
    alerts.push({
      level: d.emails.failed >= 5 ? "critical" : "warning",
      title: `${d.emails.failed} e-mail(s) com falha de envio`,
      detail: `Enviados com sucesso: ${d.emails.sent}`,
    });
  }
  if (d.refunds.count > 0) {
    alerts.push({
      level: "critical",
      title: `${d.refunds.count} reembolso(s) / contestação(ões)`,
      detail: `Valor envolvido: ${brl(d.refunds.value)}`,
    });
  }
  if (d.payoutsPending.count > 0) {
    alerts.push({
      level: "warning",
      title: `${d.payoutsPending.count} saque(s) aguardando aprovação`,
      detail: `Total solicitado: ${brl(d.payoutsPending.value)}`,
    });
  }
  if (d.tickets.open > 0) {
    alerts.push({
      level: d.tickets.open >= 10 ? "critical" : "warning",
      title: `${d.tickets.open} ticket(s) de suporte em aberto`,
      detail: `Criados no período: ${d.tickets.created} · Encerrados: ${d.tickets.closed}`,
    });
  }
  if (d.abandonedCheckouts > 0) {
    alerts.push({
      level: "warning",
      title: `${d.abandonedCheckouts} checkout(s) abandonado(s)`,
      detail: "Oportunidade de recuperação de vendas.",
    });
  }
  if (!alerts.length) {
    alerts.push({
      level: "ok",
      title: "Nenhuma ocorrência crítica",
      detail: "Pagamentos, e-mails, suporte e sistema operando normalmente.",
    });
  }
  return alerts;
}

export function buildAdminReportProps(d: AdminReportData): AdminReportEmailProps {
  const site = BRAND.site;
  return {
    reportType: d.reportType,
    reportDate: d.formattedDate,
    generatedAt: d.generatedAt,
    environment: d.environment,
    previewText: `${d.formattedDate} · Receita ${brl(d.totalRevenue)} · ${d.salesCount} vendas · ${d.newStudents} novos usuários`,
    kpis: [
      { label: "Receita Total", icon: "💰", value: brl(d.totalRevenue), delta: d.delta.revenue },
      { label: "Novas Vendas", icon: "🛒", value: num(d.salesCount), delta: d.delta.sales },
      { label: "Usuários", icon: "👥", value: num(d.newStudents), delta: d.delta.users },
      { label: "Afiliados", icon: "🤝", value: num(d.affiliateSales.count), delta: d.delta.affiliateSales },
      { label: "Comissões", icon: "📈", value: brl(d.affiliateSales.commission), delta: d.delta.commission },
    ],
    financial: [
      { label: "Receita líquida", value: brl(d.totalRevenue) },
      { label: "Receita bruta", value: brl(d.grossRevenue) },
      { label: "Taxas do gateway", value: brl(d.totalFees) },
      { label: "Faturas geradas", value: `${d.invoicesCreated.count} · ${brl(d.invoicesCreated.value)}` },
      { label: "Pagamentos confirmados", value: `${d.paymentsConfirmed.count} · ${brl(d.paymentsConfirmed.value)}` },
      { label: "Pagamentos pendentes", value: `${d.pendingPayments.count} · ${brl(d.pendingPayments.value)}` },
      { label: "Reembolsos", value: `${d.refunds.count} · ${brl(d.refunds.value)}` },
      { label: "Ticket médio", value: brl(d.avgTicket) },
      { label: "Lucro estimado", value: `${brl(d.netProfit)} (${d.margin.toFixed(0)}%)` },
    ],
    users: [
      { label: "Novos usuários", value: num(d.newStudents) },
      { label: "Usuários ativos", value: num(d.usersActive) },
      { label: "Cancelamentos / inativos", value: num(d.usersCanceled) },
      { label: "Leads capturados", value: num(d.leads) },
      { label: "Matrículas em cursos", value: num(d.courseEnrollments) },
      { label: "Afiliados ativos", value: num(d.affiliatesActive) },
    ],
    content: [
      { label: "Curso mais acessado", value: d.topCourse ? `${d.topCourse.title} (${d.topCourse.views})` : "—" },
      { label: "eBook mais baixado", value: d.topEbook ? `${d.topEbook.title} (${d.topEbook.downloads})` : "—" },
      { label: "Total de visualizações", value: num(d.totalViews) },
      { label: "Acessos a eBooks", value: num(d.ebookEnrollments) },
    ],
    alerts: buildAlerts(d),
    links: {
      dashboard: `${site}/admin`,
      financial: `${site}/admin/financeiro`,
      users: `${site}/admin/alunos`,
      affiliates: `${site}/admin/afiliados`,
    },
  };
}

export async function renderAdminReportEmail(d: AdminReportData) {
  const props = buildAdminReportProps(d);
  const html = await render(<AdminReportEmail {...props} />);
  const text = await render(<AdminReportEmail {...props} />, { plainText: true });
  return { html, text, subject: `[${d.environment}] ${d.reportType} — ${d.formattedDate}` };
}
