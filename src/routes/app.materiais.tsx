import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";

export const Route = createFileRoute("/app/materiais")({
  head: () => ({ meta: [{ title: "Planilhas e materiais — Espetinho na Veia" }] }),
  component: MaterialsPage,
});

function MaterialsPage() {
  return (
    <div>
      <PageHeader title="Planilhas e materiais" subtitle="Ferramentas prontas para acelerar seu negócio." />
      <div className="glass rounded-2xl border border-dashed border-white/10 p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-fire/20 text-primary">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhum material complementar cadastrado ainda.
        </p>
      </div>
    </div>
  );
}
