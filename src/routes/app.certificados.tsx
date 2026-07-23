import { createFileRoute } from "@tanstack/react-router";
import { Award, Download, Eye, Lock } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { certificates, student } from "@/lib/platform-data";
import { useState } from "react";

export const Route = createFileRoute("/app/certificados")({
  head: () => ({ meta: [{ title: "Certificados — Espetinho na Veia" }] }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const [preview, setPreview] = useState<typeof certificates[number] | null>(null);
  return (
    <div>
      <PageHeader title="Certificados" subtitle="Comprove sua evolução com certificados oficiais." />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {certificates.map((c) => (
          <div key={c.id} className={`glass card-tilt rounded-2xl p-6 ${c.unlocked ? "gradient-border" : "opacity-70"}`}>
            <div className="flex items-center gap-3">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${c.unlocked ? "bg-fire text-white shadow-fire" : "bg-white/5 text-muted-foreground"}`}>
                {c.unlocked ? <Award className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.unlocked ? "Liberado" : "Bloqueado"}</div>
                <div className="font-display text-lg font-bold">{c.course}</div>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-muted-foreground">Carga horária</dt><dd className="font-bold">{c.hours}h</dd></div>
              <div><dt className="text-muted-foreground">Conclusão</dt><dd className="font-bold">{c.completedAt}</dd></div>
            </dl>
            {c.unlocked && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => setPreview(c)} className="btn-fire flex-1 text-sm"><Eye className="h-4 w-4" /> Visualizar</button>
                <button className="btn-ghost-fire text-sm"><Download className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white p-10 text-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-8 border-double border-red-700/70 p-8 text-center">
              <div className="text-xs uppercase tracking-[0.3em] text-red-700">Espetinho na Veia — Certificado</div>
              <h2 className="mt-4 font-display text-4xl font-bold">Certificado de Conclusão</h2>
              <p className="mt-6 text-sm">Certificamos que</p>
              <p className="mt-2 font-display text-3xl font-bold">{student.name}</p>
              <p className="mt-4 text-sm">concluiu com aproveitamento o curso</p>
              <p className="mt-2 text-xl font-bold">{preview.course}</p>
              <p className="mt-4 text-sm">Carga horária: {preview.hours}h · Data: {preview.completedAt}</p>
              <p className="mt-6 text-xs text-gray-500">Código de validação: {preview.code}</p>
            </div>
            <button onClick={() => setPreview(null)} className="btn-fire mt-6 w-full text-sm">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
