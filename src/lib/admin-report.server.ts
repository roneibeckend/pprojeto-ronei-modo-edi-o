import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { collectDailyReport, type DailyReportData } from "@/lib/daily-report.server";

export interface AdminReportExtras {
  invoicesCreated: { count: number; value: number };
  paymentsConfirmed: { count: number; value: number };
  refunds: { count: number; value: number };
  usersActive: number;
  usersCanceled: number;
  topCourse: { title: string; views: number } | null;
  topEbook: { title: string; downloads: number } | null;
  totalViews: number;
  affiliatesActive: number;
  environment: string;
}

export interface AdminReportData extends DailyReportData, AdminReportExtras {
  /** Variação percentual vs. dia anterior (null quando não há base). */
  delta: {
    revenue: number | null;
    sales: number | null;
    users: number | null;
    affiliateSales: number | null;
    commission: number | null;
  };
  generatedAt: string;
  reportType: string;
}

function pct(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function collectExtras(dateStr: string): Promise<AdminReportExtras> {
  const supabase = supabaseAdmin;
  const start = `${dateStr}T00:00:00.000Z`;
  const end = `${dateStr}T23:59:59.999Z`;
  const paid = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];

  const [invoicesRes, confirmedRes, refundsRes, activeRes, canceledRes, progressRes, ebookEnrRes, affiliatesRes] =
    await Promise.all([
      supabase.from("payments").select("amount").gte("created_at", start).lte("created_at", end).limit(1000),
      supabase.from("payments").select("net_amount, amount").in("status", paid).gte("created_at", start).lte("created_at", end).limit(1000),
      supabase.from("payments").select("amount").in("status", ["REFUNDED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED"]).gte("updated_at", start).lte("updated_at", end).limit(1000),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).in("status", ["inactive", "canceled", "cancelado"]),
      supabase.from("progress_tracking").select("item_type, item_id").gte("started_at", start).lte("started_at", end).limit(2000),
      supabase.from("ebook_enrollments").select("ebook_id").gte("created_at", start).lte("created_at", end).limit(1000),
      supabase.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

  const invoices = (invoicesRes.data || []) as any[];
  const confirmed = (confirmedRes.data || []) as any[];
  const refunds = (refundsRes.data || []) as any[];
  const progress = (progressRes.data || []) as any[];
  const ebookEnr = (ebookEnrRes.data || []) as any[];

  const countBy = (rows: any[], key: string) => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const id = String(r[key] ?? "");
      if (!id) continue;
      map.set(id, (map.get(id) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const courseRank = countBy(progress.filter((p) => p.item_type === "course"), "item_id");
  const ebookRank = countBy(ebookEnr, "ebook_id");

  let topCourse: AdminReportExtras["topCourse"] = null;
  if (courseRank[0]) {
    const { data } = await supabase.from("courses").select("title").eq("id", courseRank[0][0]).maybeSingle();
    topCourse = { title: data?.title || courseRank[0][0], views: courseRank[0][1] };
  }

  let topEbook: AdminReportExtras["topEbook"] = null;
  if (ebookRank[0]) {
    const { data } = await supabase.from("ebooks").select("title").eq("id", ebookRank[0][0]).maybeSingle();
    topEbook = { title: data?.title || ebookRank[0][0], downloads: ebookRank[0][1] };
  }

  return {
    invoicesCreated: {
      count: invoices.length,
      value: invoices.reduce((s, p) => s + Number(p.amount || 0), 0),
    },
    paymentsConfirmed: {
      count: confirmed.length,
      value: confirmed.reduce((s, p) => s + Number(p.net_amount ?? p.amount ?? 0), 0),
    },
    refunds: {
      count: refunds.length,
      value: refunds.reduce((s, p) => s + Number(p.amount || 0), 0),
    },
    usersActive: activeRes.count || 0,
    usersCanceled: canceledRes.count || 0,
    topCourse,
    topEbook,
    totalViews: progress.length,
    affiliatesActive: affiliatesRes.count || 0,
    environment: process.env["NODE_ENV"] === "production" ? "Produção" : "Pré-visualização",
  };
}

export async function collectAdminReport(date?: string, reportType = "Relatório Diário Executivo"): Promise<AdminReportData> {
  const current = await collectDailyReport(date);
  const prevDate = shiftDate(current.dateStr, -1);

  const [previous, extras] = await Promise.all([
    collectDailyReport(prevDate).catch(() => null),
    collectExtras(current.dateStr),
  ]);

  return {
    ...current,
    ...extras,
    reportType,
    generatedAt: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date()),
    delta: {
      revenue: previous ? pct(current.totalRevenue, previous.totalRevenue) : null,
      sales: previous ? pct(current.salesCount, previous.salesCount) : null,
      users: previous ? pct(current.newStudents, previous.newStudents) : null,
      affiliateSales: previous ? pct(current.affiliateSales.count, previous.affiliateSales.count) : null,
      commission: previous ? pct(current.affiliateSales.commission, previous.affiliateSales.commission) : null,
    },
  };
}
