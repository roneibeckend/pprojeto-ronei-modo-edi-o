import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  TicketPercent, Plus, Search, Pencil, Trash2, BarChart3, Loader2,
  Power, PowerOff, Copy, Sparkles, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listCouponsAdmin, createCoupon, updateCoupon, deleteCoupon,
  getCouponReport, listProductsForCouponPicker,
} from "@/lib/coupons.functions";

const CONTEXT_OPTIONS = [
  { value: "main", label: "Produto Principal" },
  { value: "upsell", label: "Upsell" },
  { value: "downsell", label: "Downsell" },
  { value: "order_bump", label: "Order Bump" },
] as const;

type CouponForm = {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  discountType: "percentage" | "fixed";
  discountValue: string;
  startsAt: string;
  expiresAt: string;
  maxUses: string;
  maxUsesPerUser: string;
  minPurchaseAmount: string;
  autoApply: boolean;
  appliesToAll: boolean;
  allowedContexts: string[];
  products: { productId: string; productType: "course" | "ebook" }[];
};

const EMPTY_FORM: CouponForm = {
  name: "",
  code: "",
  description: "",
  isActive: true,
  discountType: "percentage",
  discountValue: "",
  startsAt: "",
  expiresAt: "",
  maxUses: "",
  maxUsesPerUser: "",
  minPurchaseAmount: "",
  autoApply: false,
  appliesToAll: true,
  allowedContexts: ["main"],
  products: [],
};

function fmtBRL(v: number) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function couponStatus(c: any): { key: string; label: string; className: string } {
  const now = new Date();
  if (!c.is_active) return { key: "inactive", label: "Inativo", className: "text-white/40 bg-white/5" };
  if (c.expires_at && new Date(c.expires_at) < now) return { key: "expired", label: "Expirado", className: "text-red-400 bg-red-400/10" };
  if (c.starts_at && new Date(c.starts_at) > now) return { key: "scheduled", label: "Agendado", className: "text-amber-400 bg-amber-400/10" };
  if (c.max_uses && c.times_used >= c.max_uses) return { key: "exhausted", label: "Esgotado", className: "text-red-400 bg-red-400/10" };
  return { key: "active", label: "Ativo", className: "text-emerald-400 bg-emerald-400/10" };
}

export function CouponsPanel() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listCouponsAdmin);
  const createFn = useServerFn(createCoupon);
  const updateFn = useServerFn(updateCoupon);
  const deleteFn = useServerFn(deleteCoupon);
  const reportFn = useServerFn(getCouponReport);
  const productsFn = useServerFn(listProductsForCouponPicker);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "expired" | "most_used" | "never_used">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [reportFor, setReportFor] = useState<any | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => listFn(),
  });

  const { data: products } = useQuery({
    queryKey: ["admin-coupon-products"],
    queryFn: () => productsFn(),
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["admin-coupon-report", reportFor?.id],
    queryFn: () => reportFn({ data: { couponId: reportFor.id } }),
    enabled: Boolean(reportFor),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { form: CouponForm; id?: string }) => {
      const f = payload.form;
      const body = {
        name: f.name,
        code: f.code,
        description: f.description || null,
        isActive: f.isActive,
        discountType: f.discountType,
        discountValue: Number(f.discountValue) || 0,
        startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
        expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
        maxUses: f.maxUses ? parseInt(f.maxUses, 10) : null,
        maxUsesPerUser: f.maxUsesPerUser ? parseInt(f.maxUsesPerUser, 10) : null,
        minPurchaseAmount: f.minPurchaseAmount ? Number(f.minPurchaseAmount) : null,
        autoApply: f.autoApply,
        appliesToAll: f.appliesToAll,
        allowedContexts: f.allowedContexts as any,
        products: f.products,
      };
      if (payload.id) return updateFn({ data: { id: payload.id, ...body } });
      return createFn({ data: body });
    },
    onSuccess: () => {
      toast.success(editing ? "Cupom atualizado!" : "Cupom criado!");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao salvar cupom."),
  });

  const toggleMutation = useMutation({
    mutationFn: async (coupon: any) => {
      return updateFn({
        data: {
          id: coupon.id,
          name: coupon.name,
          code: coupon.code,
          description: coupon.description,
          isActive: !coupon.is_active,
          discountType: coupon.discount_type,
          discountValue: Number(coupon.discount_value),
          startsAt: coupon.starts_at,
          expiresAt: coupon.expires_at,
          maxUses: coupon.max_uses,
          maxUsesPerUser: coupon.max_uses_per_user,
          minPurchaseAmount: coupon.min_purchase_amount,
          autoApply: coupon.auto_apply,
          appliesToAll: coupon.applies_to_all,
          allowedContexts: coupon.allowed_contexts,
          products: (coupon.products ?? []).map((p: any) => ({ productId: p.product_id, productType: p.product_type })),
        },
      });
    },
    onSuccess: (_d, c) => {
      toast.success(`Cupom ${c.code} ${c.is_active ? "desativado" : "ativado"}!`);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao alterar status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Cupom excluído.");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDeleting(null);
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao excluir cupom."),
  });

  const filtered = useMemo(() => {
    let list = (coupons ?? []) as any[];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    switch (filter) {
      case "active": list = list.filter((c) => couponStatus(c).key === "active"); break;
      case "inactive": list = list.filter((c) => !c.is_active); break;
      case "expired": list = list.filter((c) => couponStatus(c).key === "expired"); break;
      case "most_used": list = [...list].sort((a, b) => b.times_used - a.times_used); break;
      case "never_used": list = list.filter((c) => c.times_used === 0); break;
    }
    return list;
  }, [coupons, search, filter]);

  const totals = useMemo(() => {
    const list = (coupons ?? []) as any[];
    return {
      total: list.length,
      active: list.filter((c) => couponStatus(c).key === "active").length,
      uses: list.reduce((acc, c) => acc + (c.stats?.uses ?? 0), 0),
      revenue: list.reduce((acc, c) => acc + (c.stats?.revenue ?? 0), 0),
      discounted: list.reduce((acc, c) => acc + (c.stats?.discounted ?? 0), 0),
    };
  }, [coupons]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name,
      code: c.code,
      description: c.description ?? "",
      isActive: c.is_active,
      discountType: c.discount_type,
      discountValue: String(c.discount_value ?? ""),
      startsAt: toDatetimeLocal(c.starts_at),
      expiresAt: toDatetimeLocal(c.expires_at),
      maxUses: c.max_uses != null ? String(c.max_uses) : "",
      maxUsesPerUser: c.max_uses_per_user != null ? String(c.max_uses_per_user) : "",
      minPurchaseAmount: c.min_purchase_amount != null ? String(c.min_purchase_amount) : "",
      autoApply: c.auto_apply,
      appliesToAll: c.applies_to_all,
      allowedContexts: c.allowed_contexts ?? ["main"],
      products: (c.products ?? []).map((p: any) => ({ productId: p.product_id, productType: p.product_type })),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error("Informe o nome da campanha.");
    if (form.code.trim().length < 3) return toast.error("O código precisa de ao menos 3 caracteres.");
    if (!form.discountValue || Number(form.discountValue) <= 0) return toast.error("Informe o valor do desconto.");
    if (form.discountType === "percentage" && Number(form.discountValue) > 100) return toast.error("Desconto percentual máximo é 100%.");
    if (form.allowedContexts.length === 0) return toast.error("Selecione ao menos um contexto de aplicação.");
    if (!form.appliesToAll && form.products.length === 0) return toast.error("Selecione ao menos um produto ou marque 'todos os produtos'.");
    saveMutation.mutate({ form, id: editing?.id });
  };

  const productTitle = (p: { productId: string; productType: string }) => {
    const list = p.productType === "course" ? products?.courses : products?.ebooks;
    return list?.find((x: any) => x.id === p.productId)?.title ?? p.productId;
  };

  const filteredPickerProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const all = [
      ...(products?.courses ?? []).map((c: any) => ({ id: c.id, title: c.title, price: c.price, type: "course" as const })),
      ...(products?.ebooks ?? []).map((e: any) => ({ id: e.id, title: e.title, price: e.price, type: "ebook" as const })),
    ];
    if (!q) return all;
    return all.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, productSearch]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <TicketPercent className="h-5 w-5 text-[#ff6a00]" /> Cupons de Desconto
          </h2>
          <p className="text-[11px] text-white/40 mt-1">Crie e gerencie campanhas promocionais com controle total de validade, limites e produtos.</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto bg-[#ff6a00] hover:bg-[#ff6a00]/90 text-black font-bold uppercase text-[10px] tracking-widest h-10">
          <Plus className="h-4 w-4 mr-1" /> Novo Cupom
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total", value: totals.total },
          { label: "Ativos", value: totals.active },
          { label: "Utilizações", value: totals.uses },
          { label: "Receita c/ Cupom", value: fmtBRL(totals.revenue) },
          { label: "Total Descontado", value: fmtBRL(totals.discounted) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-black/40 p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{s.label}</p>
            <p className="text-lg font-black text-white mt-1 truncate">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ou nome..."
            className="pl-9 h-9 bg-black/40 border-white/10 text-xs"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto [-webkit-overflow-scrolling:touch] pb-1">
          {([
            ["all", "Todos"], ["active", "Ativos"], ["inactive", "Inativos"],
            ["expired", "Expirados"], ["most_used", "Mais Usados"], ["never_used", "Nunca Usados"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 h-9 rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap border transition-colors ${
                filter === key ? "bg-[#ff6a00] text-black border-[#ff6a00]" : "bg-black/40 text-white/40 border-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#ff6a00]" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
          <TicketPercent className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-xs text-white/40 font-semibold">Nenhum cupom encontrado.</p>
          <p className="text-[10px] text-white/25 mt-1">Crie seu primeiro cupom para começar uma campanha promocional.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c: any) => {
            const status = couponStatus(c);
            return (
              <div key={c.id} className="rounded-xl border border-white/5 bg-black/40 p-4 hover:border-white/10 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Código copiado!"); }}
                        className="flex items-center gap-1.5 font-mono font-black text-sm text-[#ff6a00] hover:underline underline-offset-4"
                        title="Copiar código"
                      >
                        {c.code} <Copy className="h-3 w-3 opacity-50" />
                      </button>
                      <Badge variant="outline" className={`text-[8px] uppercase tracking-widest border-none ${status.className}`}>{status.label}</Badge>
                      {c.auto_apply && <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-none text-sky-400 bg-sky-400/10"><Sparkles className="h-2.5 w-2.5 mr-0.5" /> Auto</Badge>}
                    </div>
                    <p className="text-xs font-bold text-white mt-1 truncate">{c.name}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `${fmtBRL(Number(c.discount_value))} OFF`}
                      {" · "}{c.applies_to_all ? "Todos os produtos" : `${c.products?.length ?? 0} produto(s)`}
                      {" · "}{c.times_used}{c.max_uses ? `/${c.max_uses}` : ""} uso(s)
                      {c.expires_at && ` · até ${fmtDate(c.expires_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setReportFor(c)} className="h-8 px-2.5 text-white/50 hover:text-white hover:bg-white/5" title="Relatório">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-8 px-2.5 text-white/50 hover:text-white hover:bg-white/5" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => toggleMutation.mutate(c)}
                      disabled={toggleMutation.isPending}
                      className={`h-8 px-2.5 hover:bg-white/5 ${c.is_active ? "text-amber-400/70 hover:text-amber-400" : "text-emerald-400/70 hover:text-emerald-400"}`}
                      title={c.is_active ? "Desativar" : "Ativar"}
                    >
                      {c.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(c)} className="h-8 px-2.5 text-red-400/50 hover:text-red-400 hover:bg-white/5" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white uppercase tracking-tight font-black">
              {editing ? `Editar Cupom ${editing.code}` : "Novo Cupom"}
            </DialogTitle>
            <DialogDescription className="text-white/40 text-xs">
              Configure regras, limites e onde o cupom pode ser aplicado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Identificação */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Nome da Campanha *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Black Friday 2026" className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Código do Cupom *</Label>
                <div className="flex gap-2">
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="BLACKFRIDAY" maxLength={40} className="bg-black/40 border-white/10 font-mono uppercase" />
                  <Button type="button" variant="outline" onClick={() => setForm({ ...form, code: generateCode() })} className="shrink-0 border-white/10 text-white/60 text-[10px] font-bold uppercase">Gerar</Button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Descrição Interna</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Anotações sobre esta campanha (visível apenas no admin)" rows={2} className="bg-black/40 border-white/10 text-xs" />
            </div>

            {/* Desconto */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Tipo de Desconto *</Label>
                <Select value={form.discountType} onValueChange={(v: any) => setForm({ ...form, discountType: v })}>
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Valor do Desconto * {form.discountType === "percentage" ? "(1-100)" : "(R$)"}
                </Label>
                <Input type="number" min="0" step={form.discountType === "percentage" ? "1" : "0.01"} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === "percentage" ? "Ex: 20" : "Ex: 49.90"} className="bg-black/40 border-white/10" />
              </div>
            </div>

            {/* Validade */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Início da Validade</Label>
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="bg-black/40 border-white/10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Fim da Validade</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="bg-black/40 border-white/10 text-xs" />
              </div>
            </div>

            {/* Limites */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Limite Total de Usos</Label>
                <Input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Ilimitado" className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Limite por Usuário</Label>
                <Input type="number" min="1" value={form.maxUsesPerUser} onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })} placeholder="Ilimitado" className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Compra Mínima (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.minPurchaseAmount} onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })} placeholder="Sem mínimo" className="bg-black/40 border-white/10" />
              </div>
            </div>

            {/* Produtos */}
            <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Produtos</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{form.appliesToAll ? "Válido para todos os cursos e e-books." : `${form.products.length} produto(s) selecionado(s).`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="applies-all" className="text-[10px] text-white/40">Todos</Label>
                  <Switch id="applies-all" checked={form.appliesToAll} onCheckedChange={(v) => setForm({ ...form, appliesToAll: v })} />
                </div>
              </div>

              {!form.appliesToAll && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {form.products.map((p) => (
                      <Badge key={`${p.productType}:${p.productId}`} variant="outline" className="text-[9px] border-white/10 text-white/70 gap-1 pr-1">
                        {p.productType === "course" ? "Curso" : "E-book"}: {productTitle(p)}
                        <button onClick={() => setForm({ ...form, products: form.products.filter((x) => !(x.productId === p.productId && x.productType === p.productType)) })} className="hover:text-red-400">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {form.products.length === 0 && <p className="text-[10px] text-white/25">Nenhum produto vinculado.</p>}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setProductPickerOpen(true)} className="border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Produtos
                  </Button>
                </>
              )}
            </div>

            {/* Contextos */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Onde o cupom pode ser aplicado *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONTEXT_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${form.allowedContexts.includes(opt.value) ? "border-[#ff6a00]/50 bg-[#ff6a00]/10" : "border-white/10 bg-black/20"}`}>
                    <Checkbox
                      checked={form.allowedContexts.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        setForm({
                          ...form,
                          allowedContexts: checked
                            ? [...form.allowedContexts, opt.value]
                            : form.allowedContexts.filter((c) => c !== opt.value),
                        });
                      }}
                    />
                    <span className="text-[10px] font-bold text-white/70">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Switches */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3.5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Cupom Ativo</p>
                  <p className="text-[10px] text-white/30">Disponível para uso imediato</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3.5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Aplicação Automática</p>
                  <p className="text-[10px] text-white/30">Aplica sem digitar o código</p>
                </div>
                <Switch checked={form.autoApply} onCheckedChange={(v) => setForm({ ...form, autoApply: v })} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Cancelar</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-[#ff6a00] hover:bg-[#ff6a00]/90 text-black font-bold uppercase text-[10px] tracking-widest">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar Alterações" : "Criar Cupom"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Picker Dialog */}
      <Dialog open={productPickerOpen} onOpenChange={setProductPickerOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white uppercase tracking-tight font-black text-sm">Vincular Produtos</DialogTitle>
          </DialogHeader>
          <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar produto..." className="bg-black/40 border-white/10 text-xs" />
          <ScrollArea className="h-72">
            <div className="space-y-1 pr-3">
              {filteredPickerProducts.map((p) => {
                const selected = form.products.some((x) => x.productId === p.id && x.productType === p.type);
                return (
                  <button
                    key={`${p.type}:${p.id}`}
                    onClick={() => {
                      setForm({
                        ...form,
                        products: selected
                          ? form.products.filter((x) => !(x.productId === p.id && x.productType === p.type))
                          : [...form.products, { productId: p.id, productType: p.type }],
                      });
                    }}
                    className={`w-full flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left transition-colors ${selected ? "border-[#ff6a00]/50 bg-[#ff6a00]/10" : "border-white/5 bg-black/20 hover:border-white/15"}`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.title}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">{p.type === "course" ? "Curso" : "E-book"} · {fmtBRL(Number(p.price) || 0)}</p>
                    </div>
                    <Checkbox checked={selected} className="pointer-events-none" />
                  </button>
                );
              })}
              {filteredPickerProducts.length === 0 && <p className="text-[10px] text-white/30 text-center py-6">Nenhum produto encontrado.</p>}
            </div>
          </ScrollArea>
          <Button onClick={() => setProductPickerOpen(false)} className="bg-[#ff6a00] hover:bg-[#ff6a00]/90 text-black font-bold uppercase text-[10px] tracking-widest">Concluir</Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir cupom {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-xs">
              Esta ação remove o cupom e todo o histórico de utilizações. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white/60 border-white/10 bg-transparent">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <Dialog open={Boolean(reportFor)} onOpenChange={() => setReportFor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white uppercase tracking-tight font-black flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#ff6a00]" /> Relatório — {reportFor?.code}
            </DialogTitle>
            <DialogDescription className="text-white/40 text-xs">{reportFor?.name}</DialogDescription>
          </DialogHeader>

          {reportLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#ff6a00]" /></div>
          ) : report ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Utilizações", value: report.stats.totalUses },
                  { label: "Conversões", value: report.stats.conversions },
                  { label: "Pendentes", value: report.stats.pending },
                  { label: "Receita Gerada", value: fmtBRL(report.stats.revenue) },
                  { label: "Total Descontado", value: fmtBRL(report.stats.discounted) },
                  { label: "Última Utilização", value: report.stats.lastUsedAt ? new Date(report.stats.lastUsedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/5 bg-black/40 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{s.label}</p>
                    <p className="text-base font-black text-white mt-1 truncate">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Histórico de Utilizações</p>
                {report.redemptions.length === 0 ? (
                  <p className="text-[11px] text-white/30 text-center py-6 rounded-xl border border-dashed border-white/10">Nenhuma utilização registrada ainda.</p>
                ) : (
                  <div className="space-y-1.5">
                    {report.redemptions.map((r: any) => (
                      <div key={r.id} className="rounded-lg border border-white/5 bg-black/20 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{r.user_name || "Usuário"} <span className="text-white/30 font-normal">({r.user_email || "—"})</span></p>
                          <p className="text-[10px] text-white/30 truncate">
                            {r.product_title || "Produto"} · {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-white/40 line-through">{fmtBRL(Number(r.original_amount))}</p>
                            <p className="text-xs font-black text-emerald-400">{fmtBRL(Number(r.final_amount))}</p>
                          </div>
                          <Badge variant="outline" className={`text-[8px] uppercase tracking-widest border-none ${r.status === "completed" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>
                            {r.status === "completed" ? "Convertido" : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
