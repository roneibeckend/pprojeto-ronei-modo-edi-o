import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Award, ShieldCheck, Search, Loader2, CheckCircle2, XCircle, ChevronLeft } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { verifyCertificate } from "@/lib/certificates-verify.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/verificar-certificado")({
  head: () => ({ meta: [{ title: "Verificar Certificado — Espetinho na Veia" }] }),
  component: VerifyCertificatePage,
});

function VerifyCertificatePage() {
  const [code, setCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const verifyFn = useServerFn(verifyCertificate);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      toast.error("Por favor, insira um código de certificado.");
      return;
    }

    try {
      setIsSearching(true);
      const data = await verifyFn({ data: { code: code.trim() } });
      setResult(data);
      setHasSearched(true);
      if (!data) {
        toast.error("Certificado não encontrado ou inválido.");
      }
    } catch (error: any) {
      toast.error("Erro ao verificar certificado: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <Link 
          to="/app/certificados" 
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar para Meus Certificados
        </Link>

        <div className="text-center mb-12">
          <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-[#ff6a00]/10 text-[#ff6a00] mb-6">
            <ShieldCheck className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-3xl font-black mb-4">Validação de Certificados</h1>
          <p className="text-white/50 max-w-md mx-auto">
            Verifique a autenticidade de um certificado emitido pela plataforma Espetinho na Veia através do código único.
          </p>
        </div>

        <div className="bg-[#0e0e0e] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                type="text"
                placeholder="Ex: CERT-XXXXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#ff6a00]/50 transition-colors uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="btn-fire px-8 py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verificar"
              )}
            </button>
          </form>

          {hasSearched && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {result ? (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-500/20 text-green-500">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-500">Certificado Autêntico</h3>
                      <p className="text-white/50 text-sm">Este certificado foi emitido pela nossa plataforma e é válido.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Aluno</div>
                      <div className="text-white font-medium">{result.studentName}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Conteúdo</div>
                      <div className="text-white font-medium">{result.contentTitle}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Data de Emissão</div>
                      <div className="text-white font-medium">{result.issueDateFormatted}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Código</div>
                      <div className="text-white font-mono font-medium">{result.certificate_code}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                  <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-500/20 text-red-500">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-red-500">Não Encontrado</h3>
                  <p className="mt-2 text-white/50">
                    O código informado não corresponde a nenhum certificado válido em nossa base de dados.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-white/20 text-xs">
          <p>© 2026 Espetinho na Veia. Todos os direitos reservados.</p>
          <p className="mt-1 uppercase tracking-widest">Segurança e Autenticidade Garantidas</p>
        </div>
      </div>
    </div>
  );
}
