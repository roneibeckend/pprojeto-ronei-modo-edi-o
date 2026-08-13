import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, FileText, Layout, Package, Share2, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { materials as staticMaterials } from "@/lib/platform-data";
import { generateCostSpreadsheet, generatePricingCalculator, generateInventoryControl } from "@/lib/materials-generator";
import { generateShoppingListPDF, generateEquipmentChecklistPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getMaterials } from "@/lib/materials.functions";

export const Route = createFileRoute("/app/materiais")({
  head: () => ({ meta: [{ title: "Planilhas e materiais — Espetinho na Veia" }] }),
  component: MaterialsPage,
});

function MaterialsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-materials"],
    queryFn: () => getMaterials(),
  });

  const dynamicMaterials = Array.isArray(data) ? data : [];
  const materials = [...dynamicMaterials, ...staticMaterials.filter(sm => !dynamicMaterials.some(dm => dm.title === sm.title))];

  const handleDownload = async (materialId: string, title: string, fileUrl?: string, externalUrl?: string) => {
    if (externalUrl) {
      window.open(externalUrl, "_blank");
      return;
    }

    if (fileUrl) {
      window.open(fileUrl, "_blank");
      toast.success(`Download de "${title}" iniciado!`);
      return;
    }

    try {
      switch (materialId) {
        case "m1":
          await generateCostSpreadsheet();
          break;
        case "m2":
          await generatePricingCalculator();
          break;
        case "m3":
          await generateInventoryControl();
          break;
        case "m4":
          generateShoppingListPDF();
          break;
        case "m5":
          generateEquipmentChecklistPDF();
          break;
        case "m6":
          window.open("https://www.canva.com/design/play?category=tACFasY85_A&type=TAB79-58_M0", "_blank");
          break;
        default:
          toast.info(`O material "${title}" está sendo preparado e estará disponível em breve!`);
          return;
      }
      toast.success(`Download de "${title}" iniciado com sucesso!`);
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error("Ocorreu um erro ao gerar o arquivo. Tente novamente.");
    }
  };

  const getIcon = (id: string, type: string) => {
    if (type === "XLSX") return <FileSpreadsheet className="h-6 w-6" />;
    if (type === "PDF") return <FileText className="h-6 w-6" />;
    if (type === "CANVA") return <Layout className="h-6 w-6" />;
    if (id === "m7") return <Share2 className="h-6 w-6" />;
    return <Package className="h-6 w-6" />;
  };

  return (
    <div>
      <PageHeader 
        title="Planilhas e materiais" 
        subtitle="Materiais profissionais e funcionais para gestão completa do seu negócio de espetinhos." 
      />
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : materials.map((m: any) => (
          <div key={m.id} className="glass card-tilt group flex flex-col rounded-2xl p-6 transition-all hover:border-fire/50">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-fire/10 text-primary ring-1 ring-fire/20 transition-transform group-hover:scale-110">
                {getIcon(m.id, m.type)}
              </div>
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {m.type}
              </span>
            </div>
            
            <div className="mt-5 flex-grow">
              <h3 className="font-display text-xl font-bold text-white group-hover:text-primary transition-colors">
                {m.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {m.description}
              </p>
            </div>

            <button 
              onClick={() => handleDownload(m.id, m.title, m.file_url, m.external_url)}
              className="btn-fire mt-6 w-full py-3 text-sm font-bold flex items-center justify-center gap-2 group/btn"
            >
              <Download className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" /> 
              Baixar material
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
