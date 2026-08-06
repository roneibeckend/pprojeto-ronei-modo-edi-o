import { createFileRoute } from "@tanstack/react-router";
import { Award, Download, Eye, Lock, Share2, ShieldCheck, Flame, Sparkles, X, Clock, GraduationCap, Loader2, Printer } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { certificates as baseCertificates, courses, student } from "@/lib/platform-data";
import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Estilos específicos para impressão
const printStyles = `
  @media print {
    @page {
      size: landscape;
      margin: 0;
    }
    body * {
      visibility: hidden;
    }
    #printable-certificate, #printable-certificate * {
      visibility: visible;
    }
    #printable-certificate {
      position: absolute;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      background: #f5efe4 ! from-inherit;
    }
    /* Ocultar elementos de UI no certificado durante a impressão */
    .no-print {
      display: none !important;
    }
  }
`;

async function downloadCertificatePDF(node: HTMLElement, cert: { id: string; course: string }) {
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#f5efe4",
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = canvas.width / canvas.height;
  let w = pageW;
  let h = pageW / ratio;
  if (h > pageH) {
    h = pageH;
    w = pageH * ratio;
  }
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  pdf.addImage(imgData, "JPEG", x, y, w, h);
  const safe = cert.course.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  pdf.save(`certificado-${safe}-${cert.id}.pdf`);
}

export const Route = createFileRoute("/app/certificados")({
  head: () => ({ meta: [{ title: "Certificados — Espetinho na Veia" }] }),
  component: CertificatesPage,
});

const BRAND = "#ff6a00";

function CertificatesPage() {
  // Sincronizar dinamicamente com o progresso dos cursos
  const certificates = baseCertificates.map(cert => {
    const course = courses.find(c => c.id === cert.courseId);
    const isUnlocked = course ? course.progress === 100 : cert.unlocked;
    return {
      ...cert,
      unlocked: isUnlocked,
      completedAt: isUnlocked ? (cert.completedAt === "—" ? "06/08/2026" : cert.completedAt) : "—"
    };
  });

  const [preview, setPreview] = useState<{ cert: typeof certificates[number]; autoDownload?: boolean } | null>(null);
  const unlockedCount = certificates.filter((c) => c.unlocked).length;
  const totalHours = certificates.filter((c) => c.unlocked).reduce((s, c) => s + c.hours, 0);
  const nextCert = certificates.find((c) => !c.unlocked);

  return (
    <div>
      <style>{printStyles}</style>
      <PageHeader title="Certificados" subtitle="Sua vitrine oficial de conquistas — assinada por Ronnei e verificável por código único." />

      {/* Hero stats */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Award className="h-5 w-5" strokeWidth={2.5} />} label="Conquistados" value={`${unlockedCount}/${certificates.length}`} accent />
        <StatCard icon={<Clock className="h-5 w-5" strokeWidth={2.5} />} label="Carga total" value={`${totalHours}h`} />
        <StatCard icon={<GraduationCap className="h-5 w-5" strokeWidth={2.5} />} label="Próximo objetivo" value={nextCert?.course ?? "Todos concluídos"} small />
      </div>

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {certificates.map((c) => (
          <CertCard
            key={c.id}
            cert={c}
            onPreview={() => setPreview({ cert: c })}
            onDownload={() => setPreview({ cert: c, autoDownload: true })}
          />
        ))}
      </div>

      {/* Verification band */}
      <div className="mt-10 flex flex-col items-start gap-4 rounded-xl border border-white/5 bg-[#0e0e0e] p-5 sm:flex-row sm:items-center">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#ff6a00]/10 text-[#ff6a00]">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">Verificação pública</div>
          <div className="text-xs text-white/50">
            Cada certificado tem código único (ex.: EVNA-2026-XXXX) e pode ser validado em
            <span className="ml-1 font-mono text-white/70">verifica.espetinhonaveia.com</span>
          </div>
        </div>
      </div>

      {preview && <CertificateModal cert={preview.cert} autoDownload={preview.autoDownload} onClose={() => setPreview(null)} />}
    </div>
  );
}

function StatCard({ icon, label, value, accent, small }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border ${accent ? "border-[#ff6a00]/40 bg-[#ff6a00]/[0.06]" : "border-white/5 bg-[#0e0e0e]"} p-5`}>
      {accent && <span className="absolute left-0 top-0 h-full w-1 bg-[#ff6a00]" />}
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${accent ? "bg-[#ff6a00] text-black" : "bg-white/5 text-white/70"}`}>{icon}</div>
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{label}</div>
      <div className={`mt-1 font-display font-bold text-white ${small ? "text-base" : "text-2xl"}`}>{value}</div>
    </div>
  );
}

/* -------------------- CARD -------------------- */

function CertCard({ cert, onPreview, onDownload }: { cert: typeof certificates[number]; onPreview: () => void; onDownload: () => void }) {
  const locked = !cert.unlocked;
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border transition ${
        locked ? "border-white/5 bg-[#0c0c0c] opacity-70" : "border-white/10 bg-[#0e0e0e] hover:border-[#ff6a00]/50"
      }`}
    >
      {/* Mini certificate thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/5">
        <MiniCertificate cert={cert} locked={locked} />
        {locked ? (
          <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-white/70">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60">
                <Lock className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Bloqueado</span>
            </div>
          </div>
        ) : (
          <>
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#ff6a00] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-black">
              <Sparkles className="h-3 w-3" strokeWidth={3} /> Emitido
            </span>
            <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
              <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3">
                <button onClick={onPreview} className="rounded-full bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-black shadow-xl">
                  Ampliar
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Meta */}
      <div className="p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6a00]">Certificado oficial</div>
        <h3 className="mt-1 line-clamp-2 font-display text-lg font-bold text-white">{cert.course}</h3>
        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 text-[11px]">
          <div>
            <dt className="text-white/40">Carga horária</dt>
            <dd className="font-bold text-white">{cert.hours}h</dd>
          </div>
          <div>
            <dt className="text-white/40">Emitido em</dt>
            <dd className="font-bold text-white">{cert.completedAt}</dd>
          </div>
        </dl>

        {!locked ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={onPreview}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#ff6a00] px-3 py-2 text-xs font-bold uppercase tracking-widest text-black transition hover:brightness-110"
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={2.75} /> Visualizar
            </button>
            <button onClick={onDownload} className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 text-white/70 transition hover:border-[#ff6a00]/50 hover:text-[#ff6a00]" title="Baixar PDF">
              <Download className="h-4 w-4" />
            </button>
            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 text-white/70 transition hover:border-[#ff6a00]/50 hover:text-[#ff6a00]" title="Compartilhar">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
            Conclua 100% do curso para liberar seu certificado.
          </div>
        )}
      </div>
    </article>
  );
}

/* -------------------- MINI THUMBNAIL -------------------- */

function MiniCertificate({ cert, locked }: { cert: typeof certificates[number]; locked: boolean }) {
  return (
    <div className="relative h-full w-full bg-[#f5efe4]">
      {/* Guilloché pattern */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${cert.id}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="0.6" fill={BRAND} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${cert.id})`} />
      </svg>

      {/* Corner ornaments */}
      <CornerOrnament className="absolute left-2 top-2" />
      <CornerOrnament className="absolute right-2 top-2 rotate-90" />
      <CornerOrnament className="absolute bottom-2 left-2 -rotate-90" />
      <CornerOrnament className="absolute bottom-2 right-2 rotate-180" />

      {/* Frame */}
      <div className="absolute inset-3 border border-[#ff6a00]/50" />
      <div className="absolute inset-[14px] border border-[#ff6a00]/25" />

      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.28em] text-[#ff6a00]">
          <Flame className="h-2.5 w-2.5" strokeWidth={3} /> Espetinho na Veia
        </div>
        <div className="mt-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-black/70">Certificado de Conclusão</div>
        <div className="mt-1 font-display text-lg font-extrabold uppercase text-black">{student.name}</div>
        <div className="mt-1.5 max-w-[85%] line-clamp-1 text-[9px] font-medium text-black/60">{cert.course}</div>
        {!locked && (
          <div className="mt-2 flex items-center gap-2 text-[7px] font-mono uppercase tracking-widest text-black/40">
            <span>Cód: {cert.code}</span>
          </div>
        )}
      </div>

      {/* Seal dot */}
      <div className="absolute bottom-3 right-4 grid h-6 w-6 place-items-center rounded-full bg-[#ff6a00] text-black shadow-md ring-2 ring-[#f5efe4]">
        <Flame className="h-3 w-3" strokeWidth={3} />
      </div>
    </div>
  );
}

function CornerOrnament({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className}`} viewBox="0 0 16 16" fill="none">
      <path d="M1 1H7M1 1V7" stroke={BRAND} strokeWidth="1" />
      <path d="M4 1V4H1" stroke={BRAND} strokeOpacity="0.5" strokeWidth="0.6" />
    </svg>
  );
}

/* -------------------- FULL MODAL -------------------- */

function CertificateModal({ cert, onClose, autoDownload }: { cert: typeof certificates[number]; onClose: () => void; autoDownload?: boolean }) {
  const certRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadCertificatePDF(certRef.current, cert);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

  // Auto-trigger when opened via card download button
  useEffect(() => {
    if (autoDownload) {
      const t = setTimeout(() => { handleDownload(); }, 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/90 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#ff6a00] text-black">
              <Award className="h-4 w-4" strokeWidth={2.75} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Certificado oficial</div>
              <div className="font-display text-lg font-bold text-white">{cert.course}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-md bg-[#ff6a00] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black transition hover:brightness-110 disabled:opacity-70"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={2.5} />}
              {downloading ? "Gerando..." : "Baixar PDF"}
            </button>
            <button className="flex items-center gap-1.5 rounded-md border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:border-[#ff6a00]/50">
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md border border-white/10 text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div ref={certRef}>
          <FullCertificate cert={cert} />
        </div>
      </div>
    </div>
  );
}

function FullCertificate({ cert }: { cert: typeof certificates[number] }) {
  const verifyUrl = `verifica.espetinhonaveia.com/${cert.code ?? "—"}`;
  return (
    <div className="relative overflow-hidden bg-[#f5efe4] text-[#1a1207] shadow-2xl">
      {/* Guilloché background */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.13]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mainDots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="0.8" fill={BRAND} />
          </pattern>
          <pattern id="mainWave" width="200" height="60" patternUnits="userSpaceOnUse">
            <path d="M0 30 Q 50 0 100 30 T 200 30" stroke={BRAND} strokeWidth="0.4" fill="none" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mainDots)" />
        <rect width="100%" height="100%" fill="url(#mainWave)" />
      </svg>

      {/* Diagonal ribbon */}
      <div className="pointer-events-none absolute -left-24 top-10 -rotate-45 bg-[#ff6a00] px-24 py-1.5 text-[9px] font-bold uppercase tracking-[0.32em] text-black shadow-md">
        Documento Original
      </div>

      {/* Outer frame */}
      <div className="relative m-6 border-[3px] border-[#ff6a00] sm:m-8">
        <div className="m-1.5 border border-[#ff6a00]/50">
          <div className="relative p-8 sm:p-14">
            {/* Corners */}
            <FancyCorner className="absolute -left-2 -top-2" />
            <FancyCorner className="absolute -right-2 -top-2 rotate-90" />
            <FancyCorner className="absolute -bottom-2 -left-2 -rotate-90" />
            <FancyCorner className="absolute -bottom-2 -right-2 rotate-180" />

            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#1a1207] text-[#ff6a00] shadow-md">
                  <Flame className="h-7 w-7" strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.35em] text-[#ff6a00]">Espetinho na Veia · Academia</div>
              <h1 className="mt-5 font-display text-4xl font-black uppercase tracking-wide sm:text-5xl">Certificado</h1>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.4em] text-black/60">de Conclusão</div>
              <div className="mt-4 h-[2px] w-24 bg-[#ff6a00]" />
            </div>

            {/* Body */}
            <div className="mt-8 text-center">
              <p className="text-[12px] uppercase tracking-[0.28em] text-black/50">Certificamos que</p>
              <p className="mt-3 font-display text-3xl font-extrabold uppercase tracking-wide sm:text-4xl">{student.name}</p>
              <div className="mx-auto mt-2 h-px w-64 bg-black/20" />
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-black/75 sm:text-base">
                concluiu com aproveitamento integral o curso
                <span className="mx-1.5 font-bold text-black">"{cert.course}"</span>
                oferecido pela plataforma <span className="font-bold">Espetinho na Veia</span>, cumprindo
                a carga horária de <span className="font-bold">{cert.hours} horas</span> e demonstrando
                competência prática em produção, precificação e vendas.
              </p>
            </div>

            {/* Signatures + seal */}
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <div className="text-center">
                <div className="mx-auto font-[cursive] text-2xl italic text-black/90">Ronnei</div>
                <div className="mx-auto mt-1 h-px w-48 bg-black/50" />
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/60">Ronnei — Fundador</div>
                <div className="text-[10px] text-black/40">Espetos Grill · Espetinho na Veia</div>
              </div>

              {/* Wax seal */}
              <div className="relative mx-auto grid h-24 w-24 place-items-center">
                <div className="absolute inset-0 rounded-full bg-[#ff6a00] shadow-lg" />
                <div className="absolute inset-1.5 rounded-full border-2 border-dashed border-[#f5efe4]/70" />
                <div className="absolute inset-3 rounded-full bg-[#c94f00]" />
                <div className="relative flex flex-col items-center text-[#f5efe4]">
                  <Flame className="h-6 w-6" strokeWidth={2.75} />
                  <span className="mt-0.5 font-display text-[8px] font-black uppercase tracking-widest">Oficial</span>
                </div>
                <span className="absolute -bottom-2 -right-1 rounded-full bg-black px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-[#ff6a00]">
                  #{cert.id.toUpperCase()}
                </span>
              </div>

              <div className="text-center">
                <div className="font-display text-lg font-bold text-black">{cert.completedAt}</div>
                <div className="mx-auto mt-1 h-px w-48 bg-black/50" />
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/60">Data de emissão</div>
                <div className="text-[10px] text-black/40">São Paulo · Brasil</div>
              </div>
            </div>

            {/* Footer bar */}
            <div className="mt-10 grid grid-cols-[auto_1fr_auto] items-center gap-4 border-t border-black/10 pt-5">
              {/* QR */}
              <div className="grid h-16 w-16 grid-cols-8 gap-[1px] rounded-sm bg-black p-1">
                {Array.from({ length: 64 }).map((_, i) => {
                  const seed = (cert.code ?? cert.id).charCodeAt(i % (cert.code ?? cert.id).length);
                  const on = (seed * (i + 3)) % 3 !== 0;
                  return <span key={i} className={on ? "bg-[#f5efe4]" : "bg-black"} />;
                })}
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-black/50">Código de validação</div>
                <div className="truncate font-mono text-sm font-bold text-black">{cert.code ?? "—"}</div>
                <div className="truncate text-[10px] text-black/50">{verifyUrl}</div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-black/50">Registro</div>
                <div className="font-mono text-xs text-black/70">Nº {cert.id.toUpperCase()}-{String(cert.hours).padStart(3, "0")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Micro-text security border */}
      <div className="border-t border-black/10 bg-[#efe7d6] px-6 py-2 font-mono text-[7px] uppercase tracking-[0.32em] text-black/40">
        espetinho na veia · documento oficial · válido em todo território nacional · verificação online · espetinho na veia · documento oficial · válido em todo território nacional
      </div>
    </div>
  );
}

function FancyCorner({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-8 w-8 ${className}`} viewBox="0 0 32 32" fill="none">
      <path d="M2 2H14M2 2V14" stroke={BRAND} strokeWidth="2" />
      <path d="M6 2V6H2" stroke={BRAND} strokeWidth="1" opacity="0.7" />
      <circle cx="2" cy="2" r="2" fill={BRAND} />
    </svg>
  );
}
