import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OpsHealth = "ok" | "warning" | "error" | "unknown";

export type OpsCheck = {
  key: string;
  label: string;
  health: OpsHealth;
  summary: string;
  details: { label: string; value: string }[];
};

export type OpsEvent = {
  id: string;
  source: string;
  status: "success" | "error" | "warning" | "info";
  title: string;
  detail: string | null;
  createdAt: string;
};

export type OpsStatus = {
  generatedAt: string;
  checks: OpsCheck[];
  events: OpsEvent[];
};

const HOUR = 60 * 60 * 1000;

function ago(iso: string | null | undefined): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "agora mesmo";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} dias`;
}

/** Coleta o status operacional das integrações críticas (somente admin). */
export const getOperationalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OpsStatus> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado: apenas administradores.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since24h = new Date(Date.now() - 24 * HOUR).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * HOUR).toISOString();

    const [
      asaasIntegration,
      webhookEvents,
      payments,
      reportSettings,
      reportLogs,
      transfers,
      logs,
      integrationLogs,
      emailSettings,
      emailLogs,
      payouts,
    ] = await Promise.all([
      supabaseAdmin.from("integrations").select("status, credentials, settings, updated_at").eq("category", "asaas").maybeSingle(),
      supabaseAdmin.from("asaas_webhook_events").select("event_id, event_type, status, last_error, claimed_at, processed_at").order("claimed_at", { ascending: false }).limit(50),
      supabaseAdmin.from("payments").select("external_id, amount, status, confirmed_at").order("confirmed_at", { ascending: false }).limit(10),
      supabaseAdmin.from("report_settings").select("enabled, send_time, timezone, delivery_method, updated_at").limit(1).maybeSingle(),
      supabaseAdmin.from("report_logs").select("id, report_date, status, error, sent_at, created_at").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("asaas_transfers").select("id, amount, status, transfer_date").order("transfer_date", { ascending: false }).limit(10),
      supabaseAdmin.from("system_logs").select("id, level, source, message, created_at").order("created_at", { ascending: false }).limit(40),
      supabaseAdmin.from("integration_logs").select("id, integration_name, status, message, http_code, created_at").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("email_settings").select("is_enabled, from_email, validation_status, last_validation_at").limit(1).maybeSingle(),
      supabaseAdmin.from("email_logs").select("id, recipient_email, template_name, status, error_message, created_at").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("payout_requests").select("id, amount, status, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const checks: OpsCheck[] = [];

    /* ---------------- Webhook Asaas ---------------- */
    const credentials = (asaasIntegration.data?.credentials ?? {}) as Record<string, unknown>;
    const hasApiKey = Boolean(credentials["apiKey"]);
    const hasWebhookToken = Boolean(credentials["webhookToken"]);
    const wh = webhookEvents.data ?? [];
    const whFailed = wh.filter((e) => e.status === "failed");
    const whStuck = wh.filter((e) => e.status === "processing" && e.claimed_at && Date.now() - new Date(e.claimed_at).getTime() > HOUR);
    const lastWh = wh[0];

    let whHealth: OpsHealth = "ok";
    let whSummary = "Recebendo e processando eventos normalmente.";
    if (!hasWebhookToken || !hasApiKey) {
      whHealth = "error";
      whSummary = !hasApiKey
        ? "Chave de API do Asaas não configurada — pagamentos não podem ser verificados."
        : "Token do webhook não configurado — todos os eventos são recusados.";
    } else if (whFailed.length > 0) {
      whHealth = "error";
      whSummary = `${whFailed.length} evento(s) falharam no processamento.`;
    } else if (whStuck.length > 0) {
      whHealth = "warning";
      whSummary = `${whStuck.length} evento(s) travados em processamento há mais de 1h.`;
    } else if (wh.length === 0) {
      whHealth = "warning";
      whSummary = "Nenhum evento recebido até agora. Confirme a URL do webhook no painel do Asaas.";
    }

    checks.push({
      key: "webhook",
      label: "Webhook Asaas",
      health: whHealth,
      summary: whSummary,
      details: [
        { label: "Chave de API", value: hasApiKey ? "configurada" : "ausente" },
        { label: "Token do webhook", value: hasWebhookToken ? "configurado" : "ausente" },
        { label: "Integração ativa", value: asaasIntegration.data?.status ? "sim" : "não" },
        { label: "Último evento", value: ago(lastWh?.claimed_at ?? null) },
        { label: "Eventos concluídos", value: String(wh.filter((e) => e.status === "completed").length) },
        { label: "Eventos com falha", value: String(whFailed.length) },
      ],
    });

    /* ---------------- Pagamentos ---------------- */
    const pays = payments.data ?? [];
    const pays24h = pays.filter((p) => p.confirmed_at && p.confirmed_at >= since24h);
    checks.push({
      key: "payments",
      label: "Liberação de acesso / Pagamentos",
      health: pays.length === 0 ? "warning" : "ok",
      summary:
        pays.length === 0
          ? "Nenhum pagamento confirmado registrado ainda."
          : `Último pagamento confirmado ${ago(pays[0]?.confirmed_at ?? null)}.`,
      details: [
        { label: "Confirmados (24h)", value: String(pays24h.length) },
        { label: "Total recente", value: String(pays.length) },
        {
          label: "Último valor",
          value: pays[0] ? `R$ ${Number(pays[0].amount).toFixed(2)}` : "—",
        },
      ],
    });

    /* ---------------- Cron / Relatório diário ---------------- */
    const rs = reportSettings.data;
    const rl = reportLogs.data ?? [];
    const lastReport = rl[0];
    const lastOk = rl.find((r) => r.status === "sent" || r.status === "success");
    const failedReports = rl.filter((r) => r.status === "error" || r.status === "failed");

    let cronHealth: OpsHealth = "ok";
    let cronSummary = `Relatório diário agendado para ${rs?.send_time ?? "--:--"} (${rs?.timezone ?? "UTC"}).`;
    if (!rs?.enabled) {
      cronHealth = "warning";
      cronSummary = "Envio automático do relatório diário está desativado.";
    } else if (!lastReport) {
      cronHealth = "warning";
      cronSummary = "Agendamento ativo, mas nenhuma execução registrada ainda.";
    } else if (failedReports.length > 0 && (!lastOk || failedReports[0]!.created_at! > lastOk.created_at!)) {
      cronHealth = "error";
      cronSummary = "A última execução do relatório diário falhou.";
    } else if (lastReport.created_at && Date.now() - new Date(lastReport.created_at).getTime() > 48 * HOUR) {
      cronHealth = "warning";
      cronSummary = "Nenhuma execução nas últimas 48 horas — verifique o agendamento.";
    }

    checks.push({
      key: "cron",
      label: "Processamento diário (cron)",
      health: cronHealth,
      summary: cronSummary,
      details: [
        { label: "Agendamento", value: rs?.enabled ? "ativo" : "desativado" },
        { label: "Horário", value: rs?.send_time ?? "—" },
        { label: "Entrega", value: rs?.delivery_method ?? "—" },
        { label: "Última execução", value: ago(lastReport?.created_at ?? null) },
        { label: "Falhas recentes", value: String(failedReports.length) },
      ],
    });

    /* ---------------- Saídas / Saques ---------------- */
    const tr = transfers.data ?? [];
    const po = payouts.data ?? [];
    const pendingPayouts = po.filter((p) => ["pending", "analyzing", "approved"].includes(String(p.status)));
    checks.push({
      key: "payouts",
      label: "Saques e saídas",
      health: pendingPayouts.length > 0 ? "warning" : "ok",
      summary:
        pendingPayouts.length > 0
          ? `${pendingPayouts.length} solicitação(ões) de saque aguardando análise.`
          : "Nenhuma solicitação pendente.",
      details: [
        { label: "Saques pendentes", value: String(pendingPayouts.length) },
        { label: "Última solicitação", value: ago(po[0]?.created_at ?? null) },
        { label: "Transferências sincronizadas", value: String(tr.length) },
        { label: "Última saída Asaas", value: ago(tr[0]?.transfer_date ?? null) },
      ],
    });

    /* ---------------- E-mail transacional ---------------- */
    const es = emailSettings.data;
    const el = emailLogs.data ?? [];
    const emailFailures = el.filter((e) => e.status === "error" || e.status === "failed");
    checks.push({
      key: "email",
      label: "E-mail transacional",
      health: !es?.is_enabled ? "warning" : emailFailures.length > 0 ? "error" : "ok",
      summary: !es?.is_enabled
        ? "Envio de e-mails desativado."
        : emailFailures.length > 0
          ? `${emailFailures.length} envio(s) com erro nos registros recentes.`
          : "Envios ocorrendo sem erros recentes.",
      details: [
        { label: "Status", value: es?.is_enabled ? "ativo" : "desativado" },
        { label: "Remetente", value: es?.from_email ?? "—" },
        { label: "Validação", value: es?.validation_status ?? "—" },
        { label: "Último envio", value: ago(el[0]?.created_at ?? null) },
      ],
    });

    /* ---------------- Erros do sistema ---------------- */
    const sysLogs = logs.data ?? [];
    const errors24h = sysLogs.filter((l) => l.level?.toLowerCase() === "error" && l.created_at >= since24h);
    checks.push({
      key: "errors",
      label: "Erros do sistema (24h)",
      health: errors24h.length === 0 ? "ok" : errors24h.length > 5 ? "error" : "warning",
      summary:
        errors24h.length === 0
          ? "Nenhum erro registrado nas últimas 24 horas."
          : `${errors24h.length} erro(s) nas últimas 24 horas.`,
      details: [
        { label: "Erros (24h)", value: String(errors24h.length) },
        {
          label: "Erros (7 dias)",
          value: String(sysLogs.filter((l) => l.level?.toLowerCase() === "error" && l.created_at >= since7d).length),
        },
        { label: "Último registro", value: ago(sysLogs[0]?.created_at ?? null) },
      ],
    });

    /* ---------------- Linha do tempo de eventos ---------------- */
    const events: OpsEvent[] = [];

    for (const e of wh.slice(0, 12)) {
      events.push({
        id: `wh_${e.event_id}`,
        source: "Webhook Asaas",
        status: e.status === "completed" ? "success" : e.status === "failed" ? "error" : "warning",
        title: `${e.event_type} · ${e.status}`,
        detail: e.last_error ?? null,
        createdAt: e.processed_at ?? e.claimed_at ?? new Date().toISOString(),
      });
    }

    for (const r of rl.slice(0, 8)) {
      events.push({
        id: `rp_${r.id}`,
        source: "Relatório diário",
        status: r.status === "error" || r.status === "failed" ? "error" : "success",
        title: `Relatório ${r.report_date} · ${r.status}`,
        detail: r.error ?? null,
        createdAt: r.sent_at ?? r.created_at ?? new Date().toISOString(),
      });
    }

    for (const l of integrationLogs.data ?? []) {
      events.push({
        id: `il_${l.id}`,
        source: l.integration_name || "Integração",
        status: l.status?.toLowerCase() === "success" || l.status?.toLowerCase() === "ok" ? "success" : "error",
        title: `${l.integration_name} · ${l.status}${l.http_code ? ` (${l.http_code})` : ""}`,
        detail: l.message ?? null,
        createdAt: l.created_at ?? new Date().toISOString(),
      });
    }

    for (const e of el.slice(0, 8)) {
      events.push({
        id: `em_${e.id}`,
        source: "E-mail",
        status: e.status === "error" || e.status === "failed" ? "error" : "success",
        title: `${e.template_name} → ${e.recipient_email}`,
        detail: e.error_message ?? null,
        createdAt: e.created_at ?? new Date().toISOString(),
      });
    }

    for (const l of sysLogs.slice(0, 15)) {
      const lvl = (l.level ?? "").toLowerCase();
      events.push({
        id: `sl_${l.id}`,
        source: l.source || "sistema",
        status: lvl === "error" ? "error" : lvl === "warning" ? "warning" : "info",
        title: l.message?.slice(0, 140) ?? "",
        detail: null,
        createdAt: l.created_at,
      });
    }

    events.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return {
      generatedAt: new Date().toISOString(),
      checks,
      events: events.slice(0, 60),
    };
  });
