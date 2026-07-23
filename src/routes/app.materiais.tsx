import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { materials } from "@/lib/platform-data";

export const Route = createFileRoute("/app/materiais")({
  head: () => ({ meta: [{ title: "Planilhas e materiais — Espetinho na Veia" }] }),
  component: MaterialsPage,
});

function MaterialsPage() {
  return (
    <div>
      <PageHeader title="Planilhas e materiais" subtitle="Ferramentas prontas para acelerar seu negócio." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((m) => (
          <div key={m.id} className="glass card-tilt rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-fire/20 text-primary">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{m.type}</span>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{m.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
            <button className="btn-fire mt-4 w-full text-sm"><Download className="h-4 w-4" /> Baixar material</button>
          </div>
        ))}
      </div>
    </div>
  );
}
