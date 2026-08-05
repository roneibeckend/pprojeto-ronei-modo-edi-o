import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Users, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { recipes, recipeCategories, type Recipe } from "@/lib/platform-data";

export const Route = createFileRoute("/app/receitas")({
  head: () => ({ meta: [{ title: "Receitas — Espetinho na Veia" }] }),
  component: RecipesPage,
});

function RecipesPage() {
  const [cat, setCat] = useState("Todos");
  const [open, setOpen] = useState<Recipe | null>(null);

  const filtered = cat === "Todos" ? recipes : recipes.filter((r) => r.category === cat);

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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <article key={r.id} className="glass card-tilt overflow-hidden rounded-2xl">
            <div className="aspect-video overflow-hidden">
              <img src={r.image} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{r.category}</div>
              <h3 className="mt-1 font-display text-lg font-bold">{r.name}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {r.time}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {r.yield}</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-primary" /> {r.profit}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-white/5 p-2">
                  <div className="text-muted-foreground">Custo</div>
                  <div className="mt-0.5 font-bold">{r.cost}</div>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <div className="text-muted-foreground">Venda</div>
                  <div className="mt-0.5 font-bold text-gold">{r.sellPrice}</div>
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

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setOpen(null)}>
          <div className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={open.image} alt={open.name} className="h-56 w-full object-cover" />
            <div className="p-6">
              <h3 className="font-display text-2xl font-bold">{open.name}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-bold">Ingredientes</h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {open.ingredients.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold">Modo de preparo</h4>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    {open.steps.map((s, i) => <li key={i}>{s}</li>)}
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
