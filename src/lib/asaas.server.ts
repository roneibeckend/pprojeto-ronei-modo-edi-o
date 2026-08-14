import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ASAAS_SANDBOX_URL = "https://sandbox.asaas.com/api/v3";
const ASAAS_PRODUCTION_URL = "https://www.asaas.com/api/v3";

export const ASAAS_USER_AGENT = "Lovable-LMS-Platform/1.0.0 (+https://lovable.app)";

export async function getAsaasConfig() {
  const { data: integration, error } = await supabaseAdmin
    .from("integrations")
    .select("*")
    .eq("category", "asaas")
    .eq("status", true)
    .maybeSingle();

  if (error || !integration) {
    throw new Error("Integração com Asaas não está configurada ou ativa.");
  }

  const credentials = (integration.credentials || {}) as Record<string, string>;
  const settings = (integration.settings || {}) as Record<string, any>;
  const apiKey = credentials.apiKey;

  if (!apiKey) {
    throw new Error("Chave de API do Asaas ausente nas configurações.");
  }

  const isProdKey = apiKey.startsWith("$aact_prod_");
  const isSandboxKey = apiKey.startsWith("$aact_test_");

  let isTestMode =
    settings.testMode === true || settings.testMode === "true" || settings.environment === "sandbox";

  if (isProdKey && isTestMode) {
    console.warn("[Asaas] Chave de PRODUÇÃO detectada em ambiente de TESTE. Forçando PRODUÇÃO.");
    isTestMode = false;
  } else if (isSandboxKey && !isTestMode) {
    console.warn("[Asaas] Chave de SANDBOX detectada em ambiente de PRODUÇÃO. Forçando SANDBOX.");
    isTestMode = true;
  }

  return {
    apiKey,
    baseUrl: isTestMode ? ASAAS_SANDBOX_URL : ASAAS_PRODUCTION_URL,
    isTestMode,
  };
}

export function asaasHeaders(apiKey: string) {
  return {
    accept: "application/json",
    "content-type": "application/json",
    access_token: apiKey,
    "User-Agent": ASAAS_USER_AGENT,
  };
}

export function buildExternalReference(opts: {
  productType: string;
  productId: string;
  userId: string;
  affiliateRef?: string | null;
}) {
  return [
    opts.productType,
    opts.productId,
    `u_${opts.userId}`,
    ...(opts.affiliateRef ? [`ref_${opts.affiliateRef}`] : []),
  ].join(":");
}

export function parseExternalReference(ref: string | null | undefined) {
  if (!ref || !ref.includes(":")) return null;
  const parts = ref.split(":");
  const userPart = parts.find((p) => p.startsWith("u_"));
  const affiliatePart = parts.find((p) => p.startsWith("ref_"));
  return {
    productType: parts[0],
    productId: parts[1],
    userId: userPart ? userPart.replace("u_", "") : null,
    affiliateCode: affiliatePart ? affiliatePart.replace("ref_", "") : null,
  };
}

export async function grantAccess(
  productType: string,
  productId: string,
  userId: string,
): Promise<boolean> {
  if (productType === "course") {
    const { error } = await supabaseAdmin
      .from("course_enrollments")
      .upsert({ user_id: userId, course_id: productId }, { onConflict: "user_id,course_id" });
    if (error) {
      console.error("[Asaas] Falha ao matricular em curso:", error);
      return false;
    }
    return true;
  }
  if (productType === "ebook") {
    const { error } = await supabaseAdmin
      .from("ebook_enrollments")
      .upsert({ user_id: userId, ebook_id: productId }, { onConflict: "user_id,ebook_id" });
    if (error) {
      console.error("[Asaas] Falha ao matricular em ebook:", error);
      return false;
    }
    return true;
  }
  return false;
}

/** Resolve o usuário a partir do pagamento quando a referência externa não traz o id. */
export async function resolveUserFromPayment(payment: any, baseUrl: string, apiKey: string) {
  const emailFromPayload = payment?.customerEmail;
  let email: string | null = emailFromPayload || null;

  if (!email && payment?.customer) {
    try {
      const res = await fetch(`${baseUrl}/customers/${payment.customer}`, {
        headers: asaasHeaders(apiKey),
      });
      if (res.ok) {
        const customer = await res.json();
        email = customer?.email || null;
      }
    } catch (e) {
      console.error("[Asaas] Falha ao buscar cliente:", e);
    }
  }

  if (!email) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  return profile?.id || null;
}

export async function fetchPaymentFromAsaas(paymentId: string) {
  const { apiKey, baseUrl } = await getAsaasConfig();
  const res = await fetch(`${baseUrl}/payments/${paymentId}`, {
    headers: asaasHeaders(apiKey),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new Error(`Asaas API error (${res.status}): ${errorBody}`);
  }

  return await res.json();
}


/** Consulta o Asaas por pagamentos confirmados de um produto para um usuário. */
export async function findConfirmedPayment(params: {
  productType: string;
  productId: string;
  userId: string;
  userEmail?: string | null;
}) {
  const { apiKey, baseUrl } = await getAsaasConfig();
  const strictPrefix = `${params.productType}:${params.productId}:u_${params.userId}`;
  const legacyPrefix = `${params.productType}:${params.productId}`;
  const email = params.userEmail?.toLowerCase() || null;

  for (const status of ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]) {
    const res = await fetch(`${baseUrl}/payments?status=${status}&limit=100`, {
      headers: asaasHeaders(apiKey),
    });
    if (!res.ok) continue;
    const json = await res.json();
    const payments: any[] = json?.data || [];

    const strict = payments.find(
      (p) => typeof p.externalReference === "string" && p.externalReference.startsWith(strictPrefix),
    );
    if (strict) return strict;

    // Compatibilidade com links antigos (sem o id do usuário na referência):
    // valida a titularidade pelo e-mail do cliente no Asaas.
    if (email) {
      const legacyCandidates = payments.filter(
        (p) =>
          typeof p.externalReference === "string" &&
          p.externalReference.startsWith(legacyPrefix) &&
          !p.externalReference.includes(":u_"),
      );

      for (const candidate of legacyCandidates) {
        const ownerId = await resolveUserFromPayment(candidate, baseUrl, apiKey);
        if (ownerId === params.userId) return candidate;
      }
    }
  }
  return null;
}

