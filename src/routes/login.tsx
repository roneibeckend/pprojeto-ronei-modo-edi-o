import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, Mail, Lock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { IMG } from "@/lib/platform-data";

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

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("andre@exemplo.com");
  const [password, setPassword] = useState("demo1234");

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Hero image */}
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

      {/* Form */}
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

          <h1 className="font-display text-3xl font-bold">Acesse sua área de membros</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre para continuar seus cursos, e-books e materiais.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/app" });
            }}
            className="mt-8 space-y-4"
          >
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
                  className="w-full rounded-xl border border-white/10 bg-secondary/50 px-10 py-3 outline-none focus:border-primary"
                  required
                />
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-[oklch(0.63_0.24_27)]" />
                Lembrar meu acesso
              </label>
              <button type="button" className="text-gold hover:underline">Esqueci minha senha</button>
            </div>

            <button type="submit" className="btn-fire w-full">
              Entrar na plataforma <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não é aluno?{" "}
            <Link to="/" className="text-gold hover:underline">Conheça o eBook</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
