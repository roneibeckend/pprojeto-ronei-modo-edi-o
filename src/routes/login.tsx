import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Mail, Lock, ArrowRight, Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IMG } from "@/lib/platform-data";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { validatePassword } from "@/lib/password-validation";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Espetinho na Veia | Área de Membros" },
      { name: "description", content: "Acesse sua área de membros da plataforma Espetinho na Veia e continue seus cursos e e-books." },
      { property: "og:title", content: "Login — Espetinho na Veia" },
      { property: "og:description", content: "Área de membros exclusiva com cursos, e-books e materiais para lucrar com espetinhos." },
    ],
  }),
  component: LoginPage,
});

type Mode = "login" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Se já estiver logado, manda direto para a página inicial
  useEffect(() => {
    // Capturar referência do afiliado da URL para persistir após login/signup
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const redirectTo = urlParams.get('redirectTo');
    
    if (ref) {
      localStorage.setItem('affiliate_referrer_code', ref);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Se houver redirectTo, usa ele, senão vai para /inicio
        const target = redirectTo || "/inicio";
        navigate({ to: target, replace: true });
      }
    });
  }, [navigate]);


  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Não foi possível entrar com Google", { description: String(result.error?.message ?? result.error) });
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      // Tokens já setados; segue pra plataforma
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo');
      navigate({ to: redirectTo || "/inicio" });
    } catch (err) {

      toast.error("Erro ao conectar com Google");
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === "signup") {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        toast.error("Senha inválida", { description: validation.message });
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/inicio`,
          },
        });
        // Login automático se o Supabase não o fizer (auto-confirmação ativada/desativada)
        if (!data.session) {
          const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          
          // Se logou com sucesso, a sessão está em signInData.session
          if (signInData.session) {
            toast.success("Conta criada!", { description: "Você já pode acessar sua área de membros." });
          }
        } else {
          toast.success("Conta criada!", { description: "Você já pode acessar sua área de membros." });
        }
        
        // Disparar e-mail de boas-vindas
        try {
          const { sendEmail } = await import("@/lib/resend.functions");
          // @ts-ignore - trigger via server function
          await sendEmail({
            data: {
              to: email,
              template: 'boas_vindas',
              data: { name: name || email.split('@')[0] }
            }
          });
        } catch (emailErr) {
          console.error("[Auth] Erro ao disparar e-mail de boas-vindas:", emailErr);
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirectTo');
        navigate({ to: redirectTo || "/inicio", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirectTo');
        navigate({ to: redirectTo || "/inicio" });
      }
    } catch (err: any) {

      const msg = err?.message ?? "Falha ao autenticar";
      if (/invalid login credentials/i.test(msg)) {
        toast.error("E-mail ou senha incorretos");
      } else if (/already registered/i.test(msg) || /user already/i.test(msg)) {
        toast.error("E-mail já cadastrado", { description: "Faça login em vez de criar conta." });
        setMode("login");
      } else if (/password/i.test(msg)) {
        toast.error("Problema com a senha", { 
          description: msg.includes("weak") 
            ? "Sua senha é muito fraca. Tente misturar letras e números." 
            : msg 
        });
      } else {
        toast.error("Não foi possível continuar", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2 safe-top safe-bottom">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={IMG.chef} alt="Preparando espetinhos na brasa" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-widest text-white/80 backdrop-blur">
            <Flame className="h-3.5 w-3.5" /> Área de membros
          </div>
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            Aprenda, coloque em prática e transforme espetinhos em uma <span className="text-gradient-fire">fonte de renda</span>.
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-fire shadow-fire">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-gradient-fire">Espetinho na Veia</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Plataforma oficial</div>
            </div>
          </div>

          <h1 className="font-display text-3xl font-bold">
            {isSignup ? "Crie sua conta de aluno" : "Acesse sua área de membros"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Preencha seus dados para começar."
              : "Entre para continuar seus cursos, e-books e materiais."}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.12A6.98 6.98 0 015.5 12c0-.74.12-1.45.34-2.12V7.04H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.96l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" />
            ou com e-mail
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <label className="block">
                <span className="mb-1.5 block text-sm">Nome completo</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-secondary/50 px-10 py-3 outline-none focus:border-primary"
                    required
                    autoComplete="name"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm">E-mail</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-secondary/50 px-10 py-3 outline-none focus:border-primary"
                  required
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm">Senha</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-secondary/50 px-10 py-3 outline-none focus:border-primary"
                  required
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />
              </div>
            </label>

            <button type="submit" disabled={loading} className="btn-fire w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Aguarde…
                </>
              ) : isSignup ? (
                <>
                  Criar conta <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Entrar na plataforma <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>
                Já tem conta?{" "}
                <button className="text-gold hover:underline" onClick={() => setMode("login")}>
                  Entrar
                </button>
              </>
            ) : (
              <>
                Ainda não é aluno?{" "}
                <button className="text-gold hover:underline" onClick={() => setMode("signup")}>
                  Criar conta grátis
                </button>
              </>
            )}
          </p>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            <button onClick={() => window.history.back()} className="hover:underline">← Voltar</button>
          </p>
        </div>
      </div>
    </div>
  );
}
