import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// DTO serializável retornado pelas validações de cupom.
export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  message?: string;
  code?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;
}

function toValidationResult(raw: any): CouponValidationResult {
  if (!raw || typeof raw !== "object") {
    return { valid: false, reason: "error", message: "Resposta inesperada ao validar o cupom." };
  }
  return {
    valid: Boolean(raw.valid),
    reason: raw.reason != null ? String(raw.reason) : undefined,
    message: raw.message != null ? String(raw.message) : undefined,
    code: raw.code != null ? String(raw.code) : undefined,
    discountType: raw.discount_type === "percentage" || raw.discount_type === "fixed" ? raw.discount_type : undefined,
    discountValue: raw.discount_value != null ? Number(raw.discount_value) : undefined,
    discountAmount: raw.discount_amount != null ? Number(raw.discount_amount) : undefined,
    finalAmount: raw.final_amount != null ? Number(raw.final_amount) : undefined,
  };
}

// ============================================================================
// Validação pública (landing page, antes do login) — sem limite por usuário.
// O desconto real é sempre recalculado no servidor na criação do checkout.
// ============================================================================
export const validateCouponPublic = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      code: z.string().trim().min(3, "Código muito curto").max(40, "Código muito longo"),
      productId: z.string().optional(),
      productType: z.enum(["course", "ebook"]).optional(),
      amount: z.number().nonnegative().optional(),
      context: z.enum(["main", "upsell", "downsell", "order_bump"]).optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await (supabaseAdmin as any).rpc("validate_coupon", {
      p_code: data.code,
      p_product_id: data.productId ?? null,
      p_product_type: data.productType ?? null,
      p_amount: data.amount ?? null,
      p_user_id: null,
      p_context: data.context ?? "main",
    });
    if (error) {
      console.error("[Coupons] Erro na validação pública:", error);
      return { valid: false, reason: "error", message: "Não foi possível validar o cupom agora. Tente novamente." } as CouponValidationResult;
    }
    return toValidationResult(result);
  });

// ============================================================================
// Validação autenticada (checkout dentro do app) — inclui limite por usuário.
// ============================================================================
export const validateCouponCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      code: z.string().trim().min(3, "Código muito curto").max(40, "Código muito longo"),
      productId: z.string().optional(),
      productType: z.enum(["course", "ebook"]).optional(),
      amount: z.number().nonnegative().optional(),
      context: z.enum(["main", "upsell", "downsell", "order_bump"]).optional(),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await (supabaseAdmin as any).rpc("validate_coupon", {
      p_code: data.code,
      p_product_id: data.productId ?? null,
      p_product_type: data.productType ?? null,
      p_amount: data.amount ?? null,
      p_user_id: context.userId,
      p_context: data.context ?? "main",
    });
    if (error) {
      console.error("[Coupons] Erro na validação autenticada:", error);
      return { valid: false, reason: "error", message: "Não foi possível validar o cupom agora. Tente novamente." } as CouponValidationResult;
    }
    return toValidationResult(result);
  });

// ============================================================================
// Cupom de aplicação automática para um produto (landing page / vitrine).
// ============================================================================
export const getAutoApplyCoupon = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      productId: z.string(),
      productType: z.enum(["course", "ebook"]),
      amount: z.number().nonnegative(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const now = new Date().toISOString();

    const { data: coupons, error } = await db
      .from("coupons")
      .select("code")
      .eq("auto_apply", true)
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !coupons?.length) return { found: false };

    for (const c of coupons) {
      const { data: v } = await db.rpc("validate_coupon", {
        p_code: c.code,
        p_product_id: data.productId,
        p_product_type: data.productType,
        p_amount: data.amount,
        p_user_id: null,
        p_context: "main",
      });
      if (v?.valid) return { found: true, ...v };
    }
    return { found: false };
  });

// ============================================================================
// ADMIN — Listagem com estatísticas agregadas
// ============================================================================
export const listCouponsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const db = context.supabase as any;
    const [{ data: coupons, error }, { data: links }, { data: redemptions }] = await Promise.all([
      db.from("coupons").select("*").order("created_at", { ascending: false }),
      db.from("coupon_products").select("coupon_id, product_id, product_type"),
      db.from("coupon_redemptions").select("coupon_id, status, original_amount, discount_amount, final_amount, created_at"),
    ]);
    if (error) throw new Error(error.message);

    const stats = new Map<string, { uses: number; conversions: number; revenue: number; discounted: number; lastUsedAt: string | null }>();
    for (const r of redemptions ?? []) {
      const s = stats.get(r.coupon_id) ?? { uses: 0, conversions: 0, revenue: 0, discounted: 0, lastUsedAt: null };
      s.uses += 1;
      if (r.status === "completed") {
        s.conversions += 1;
        s.revenue += Number(r.final_amount) || 0;
        s.discounted += Number(r.discount_amount) || 0;
      }
      if (!s.lastUsedAt || r.created_at > s.lastUsedAt) s.lastUsedAt = r.created_at;
      stats.set(r.coupon_id, s);
    }

    return (coupons ?? []).map((c: any) => ({
      ...c,
      products: (links ?? []).filter((l: any) => l.coupon_id === c.id),
      stats: stats.get(c.id) ?? { uses: 0, conversions: 0, revenue: 0, discounted: 0, lastUsedAt: null },
    }));
  });

// ============================================================================
// ADMIN — Criar cupom
// ============================================================================
export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      name: z.string().trim().min(2, "Nome muito curto").max(120),
      code: z.string().trim().min(3, "Mínimo 3 caracteres").max(40, "Máximo 40 caracteres"),
      description: z.string().trim().max(500).optional().nullable(),
      isActive: z.boolean(),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number().nonnegative("Valor não pode ser negativo"),
      startsAt: z.string().optional().nullable(),
      expiresAt: z.string().optional().nullable(),
      maxUses: z.number().int().positive().optional().nullable(),
      maxUsesPerUser: z.number().int().positive().optional().nullable(),
      minPurchaseAmount: z.number().nonnegative().optional().nullable(),
      autoApply: z.boolean(),
      appliesToAll: z.boolean(),
      allowedContexts: z.array(z.enum(["main", "upsell", "downsell", "order_bump"])).min(1, "Selecione ao menos um contexto"),
      products: z.array(z.object({
        productId: z.string(),
        productType: z.enum(["course", "ebook"]),
      })).default([]),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const db = context.supabase as any;
    const { data: coupon, error } = await db
      .from("coupons")
      .insert({
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        is_active: data.isActive,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        starts_at: data.startsAt || null,
        expires_at: data.expiresAt || null,
        max_uses: data.maxUses ?? null,
        max_uses_per_user: data.maxUsesPerUser ?? null,
        min_purchase_amount: data.minPurchaseAmount ?? null,
        auto_apply: data.autoApply,
        applies_to_all: data.appliesToAll,
        allowed_contexts: data.allowedContexts,
        created_by: context.userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") throw new Error("Já existe um cupom com este código.");
      throw new Error(error.message);
    }

    if (!data.appliesToAll && data.products.length > 0) {
      const { error: linkError } = await db.from("coupon_products").insert(
        data.products.map((p) => ({ coupon_id: coupon.id, product_id: p.productId, product_type: p.productType }))
      );
      if (linkError) throw new Error(linkError.message);
    }

    return coupon;
  });

// ============================================================================
// ADMIN — Atualizar cupom
// ============================================================================
export const updateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(2).max(120),
      code: z.string().trim().min(3).max(40),
      description: z.string().trim().max(500).optional().nullable(),
      isActive: z.boolean(),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number().nonnegative(),
      startsAt: z.string().optional().nullable(),
      expiresAt: z.string().optional().nullable(),
      maxUses: z.number().int().positive().optional().nullable(),
      maxUsesPerUser: z.number().int().positive().optional().nullable(),
      minPurchaseAmount: z.number().nonnegative().optional().nullable(),
      autoApply: z.boolean(),
      appliesToAll: z.boolean(),
      allowedContexts: z.array(z.enum(["main", "upsell", "downsell", "order_bump"])).min(1),
      products: z.array(z.object({
        productId: z.string(),
        productType: z.enum(["course", "ebook"]),
      })).default([]),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const db = context.supabase as any;
    const { error } = await db
      .from("coupons")
      .update({
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        is_active: data.isActive,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        starts_at: data.startsAt || null,
        expires_at: data.expiresAt || null,
        max_uses: data.maxUses ?? null,
        max_uses_per_user: data.maxUsesPerUser ?? null,
        min_purchase_amount: data.minPurchaseAmount ?? null,
        auto_apply: data.autoApply,
        applies_to_all: data.appliesToAll,
        allowed_contexts: data.allowedContexts,
      })
      .eq("id", data.id);

    if (error) {
      if (error.code === "23505") throw new Error("Já existe um cupom com este código.");
      throw new Error(error.message);
    }

    // Substitui vínculos de produtos
    await db.from("coupon_products").delete().eq("coupon_id", data.id);
    if (!data.appliesToAll && data.products.length > 0) {
      const { error: linkError } = await db.from("coupon_products").insert(
        data.products.map((p) => ({ coupon_id: data.id, product_id: p.productId, product_type: p.productType }))
      );
      if (linkError) throw new Error(linkError.message);
    }

    return { ok: true };
  });

// ============================================================================
// ADMIN — Excluir cupom
// ============================================================================
export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const db = context.supabase as any;
    const { error } = await db.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================================
// ADMIN — Relatório detalhado de um cupom
// ============================================================================
export const getCouponReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ couponId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const db = context.supabase as any;
    const { data: redemptions, error } = await db
      .from("coupon_redemptions")
      .select("*")
      .eq("coupon_id", data.couponId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const rows = redemptions ?? [];
    const userIds = [...new Set(rows.map((r: any) => r.user_id))] as string[];
    const courseIds = [...new Set(rows.filter((r: any) => r.product_type === "course").map((r: any) => r.product_id))] as string[];
    const ebookIds = [...new Set(rows.filter((r: any) => r.product_type === "ebook").map((r: any) => r.product_id))] as string[];

    const [profilesRes, coursesRes, ebooksRes] = await Promise.all([
      userIds.length ? context.supabase.from("profiles").select("id, name, email").in("id", userIds) : { data: [] },
      courseIds.length ? context.supabase.from("courses").select("id, title").in("id", courseIds) : { data: [] },
      ebookIds.length ? context.supabase.from("ebooks").select("id, title").in("id", ebookIds) : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const titleMap = new Map<string, string>();
    for (const c of (coursesRes.data ?? []) as any[]) titleMap.set(`course:${c.id}`, c.title);
    for (const e of (ebooksRes.data ?? []) as any[]) titleMap.set(`ebook:${e.id}`, e.title);

    const completed = rows.filter((r: any) => r.status === "completed");
    const stats = {
      totalUses: rows.length,
      conversions: completed.length,
      pending: rows.filter((r: any) => r.status === "pending").length,
      revenue: completed.reduce((acc: number, r: any) => acc + (Number(r.final_amount) || 0), 0),
      discounted: completed.reduce((acc: number, r: any) => acc + (Number(r.discount_amount) || 0), 0),
      lastUsedAt: rows[0]?.created_at ?? null,
    };

    return {
      stats,
      redemptions: rows.map((r: any) => ({
        ...r,
        user_name: (profileMap.get(r.user_id) as any)?.name ?? null,
        user_email: (profileMap.get(r.user_id) as any)?.email ?? null,
        product_title: r.product_id ? titleMap.get(`${r.product_type}:${r.product_id}`) ?? r.product_id : null,
      })),
    };
  });

// ============================================================================
// ADMIN — Lista de produtos para o seletor de cupons
// ============================================================================
export const listProductsForCouponPicker = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const [{ data: courses }, { data: ebooks }] = await Promise.all([
      context.supabase.from("courses").select("id, title, price, status").order("title"),
      context.supabase.from("ebooks").select("id, title, price, status").order("title"),
    ]);

    return {
      courses: (courses ?? []).map((c: any) => ({ id: c.id, title: c.title, price: c.price, status: c.status })),
      ebooks: (ebooks ?? []).map((e: any) => ({ id: e.id, title: e.title, price: e.price, status: e.status })),
    };
  });
