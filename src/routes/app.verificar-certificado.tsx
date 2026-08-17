import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  CheckCircle2, 
  Search, 
  Loader2, 
  Award, 
  Calendar, 
  User, 
  BookOpen,
  QrCode,
  ShieldCheck,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/verificar-certificado")({
  component: VerificarCertificado,
});

function VerificarCertificado() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;

    try {
      setLoading(true);
      setError(null);
      setCertificate(null);

      const { data, error: certError } = await supabase
        .from("certificates" as any)
        .select(`
          *,
          profile:profiles(full_name),
          template:certificate_templates(*)
        `)
        .eq("certificate_code", code.trim().toUpperCase())
        .maybeSingle();

      if (certError) throw certError;

      if (!data) {
        setError("Certificado não encontrado. Verifique o código e tente novamente.");
        return;
      }

      const certData = data as any;

      if (certData.is_revoked) {
        setError("Este certificado foi revogado e não é mais válido.");
        return;
      }

      // Fetch content title
      let contentTitle = "";
      if (certData.content_type === "course") {
        const { data: course } = await supabase
          .from("courses" as any)
          .select("title")
          .eq("id", certData.content_id)
          .maybeSingle();
        contentTitle = (course as any)?.title || "Curso";
      } else {
        const { data: ebook } = await supabase
          .from("ebooks" as any)
          .select("title")
          .eq("id", certData.content_id)
          .maybeSingle();
        contentTitle = (ebook as any)?.title || "E-book";
      }

      setCertificate({
        ...certData,
        contentTitle,
        studentName: certData.profile?.full_name || "Aluno",
        template: certData.template
      });
    } catch (err: any) {
      setError("Erro ao verificar certificado. Tente novamente mais tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8 py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#ff6a00]/10 border border-[#ff6a00]/20 mb-2">
            <ShieldCheck className="h-8 w-8 text-[#ff6a00]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
            Verificador de <span className="text-[#ff6a00]">Certificados</span>
          </h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Valide a autenticidade dos certificados emitidos pela nossa plataforma informando o código de autenticação único.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleVerify} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: CERT-A1B2C3D4"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-lg outline-none focus:border-[#ff6a00] transition-colors uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code}
              className="bg-[#ff6a00] hover:bg-[#ff8c33] disabled:opacity-50 text-black font-black uppercase italic tracking-tighter px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <QrCode className="h-5 w-5" />
                  Verificar
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          {certificate && (
            <div className="mt-8 space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center justify-center gap-2 text-green-500 font-bold mb-8">
                <CheckCircle2 className="h-6 w-6" />
                Certificado Autêntico e Válido
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <User className="h-3 w-3" /> Aluno
                    </label>
                    <div className="text-xl font-bold">{certificate.studentName}</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <BookOpen className="h-3 w-3" /> Conteúdo
                    </label>
                    <div className="text-xl font-bold">{certificate.contentTitle}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Data de Emissão
                      </label>
                      <div className="font-bold">
                        {new Date(certificate.issue_date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Award className="h-3 w-3" /> Carga Horária
                      </label>
                      <div className="font-bold">{certificate.custom_data?.hours || 40}h</div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[200px]">
                  {certificate.template?.background_url ? (
                    <>
                      <img 
                        src={certificate.template.background_url} 
                        alt="Template Layout" 
                        className="absolute inset-0 w-full h-full object-contain opacity-20"
                      />
                      <div className="relative z-10">
                        <FileText className="h-12 w-12 text-[#ff6a00] mx-auto mb-4" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Código de Autenticação</div>
                        <div className="text-2xl font-black italic tracking-tighter text-[#ff6a00]">{certificate.certificate_code}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileText className="h-12 w-12 text-[#ff6a00] mx-auto mb-4" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Código de Autenticação</div>
                      <div className="text-2xl font-black italic tracking-tighter text-[#ff6a00]">{certificate.certificate_code}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-white/40 hover:text-[#ff6a00] text-sm font-bold transition-colors"
          >
            ← Voltar para a Home
          </a>
        </div>
      </div>
    </div>
  );
}
