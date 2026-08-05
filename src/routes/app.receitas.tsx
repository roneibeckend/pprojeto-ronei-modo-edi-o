import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Users, TrendingUp, Loader2 } from "lucide-react";
import { CoverImage } from "@/components/platform/CoverImage";
import { PageHeader } from "@/components/platform/Shell";
import { useRecipes } from "@/hooks/use-queries";
import { recipeCategories } from "@/lib/platform-data";

export const Route = createFileRoute("/app/receitas")({
  head: () => ({ meta: [{ title: "Receitas — Espetinho na Veia" }] }),
  component: RecipesPage,
});

function RecipesPage() {
  const [cat, setCat] = useState("Todos");
  const [open, setOpen] = useState<any | null>(null);
  const { data: recipes, isLoading } = useRecipes();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = cat === "Todos" ? recipes : recipes?.filter((r: any) => r.category === cat);

  return (
    <div>
      <PageHeader title="Receitas" subtitle="Receitas testadas com custo, preço e lucro estimado." />

      <div className="mb-6 flex flex-wrap gap-2">
        {recipeCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              cat === c ? "border-transparent bg-fire text-white shadow-fire" : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered && filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r: any) => (
            <article key={r.id} className="glass card-tilt overflow-hidden rounded-2xl">
              <div className="aspect-video overflow-hidden">
                <CoverImage src={r.image_url} alt={r.name} loading="lazy" />
              </div>
              <div className="p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{r.category}</div>
                <h3 className="mt-1 font-display text-lg font-bold">{r.name}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {r.prep_time}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {r.yield}</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-primary" /> {r.profit_margin}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="text-muted-foreground">Custo</div>
                    <div className="mt-0.5 font-bold">{r.cost}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="text-muted-foreground">Venda</div>
                    <div className="mt-0.5 font-bold text-gold">{r.sell_price}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="text-muted-foreground">Nível</div>
                    <div className="mt-0.5 font-bold">{r.difficulty}</div>
                  </div>
                </div>
                <button onClick={() => setOpen(r)} className="btn-fire mt-4 w-full text-sm">Ver receita</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-2xl border border-dashed border-white/10">
          <p className="text-muted-foreground">Nenhuma receita encontrada para esta categoria.</p>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setOpen(null)}>
          <div className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-56 w-full"><CoverImage src={open.image_url} alt={open.name} /></div>
            <div className="p-6">
              <h3 className="font-display text-2xl font-bold">{open.name}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-bold">Ingredientes</h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {open.ingredients?.map((i: string) => <li key={i}>{i}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold">Modo de preparo</h4>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    {open.steps?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              </div>
              <button onClick={() => setOpen(null)} className="btn-ghost-fire mt-6 w-full text-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
