import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Home,
  GraduationCap,
  BookOpen,
  ChefHat,
  FileSpreadsheet,
  TrendingUp,
  Award,
  LifeBuoy,
  User,
  LogOut,
  Menu,
  X,
  Flame,
  Shield,
} from "lucide-react";
import { student } from "@/lib/platform-data";

const nav = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/cursos", label: "Meus cursos", icon: GraduationCap },
  { to: "/app/ebooks", label: "Biblioteca de e-books", icon: BookOpen },
  { to: "/app/receitas", label: "Receitas", icon: ChefHat },
  { to: "/app/materiais", label: "Planilhas e materiais", icon: FileSpreadsheet },
  { to: "/app/progresso", label: "Meu progresso", icon: TrendingUp },
  { to: "/app/certificados", label: "Certificados", icon: Award },
  { to: "/app/suporte", label: "Suporte", icon: LifeBuoy },
  { to: "/app/perfil", label: "Meu perfil", icon: User },
  { to: "/app/admin", label: "Admin (demo)", icon: Shield },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/5 px-5 py-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fire shadow-fire">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold leading-tight">
            <span className="text-gradient-fire">Espetinho na Veia</span>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Área de membros</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const active = isActive(item.to, "exact" in item ? item.exact : false);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-fire text-white shadow-fire"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <button
          onClick={() => navigate({ to: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/5 bg-black/40 backdrop-blur lg:block">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-charcoal">
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-bold sm:text-xl">
              <span className="text-gradient-fire">Espetinho na Veia</span>
            </div>
          </div>
          <Link to="/app/perfil" className="flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 hover:border-white/20">
            <img src={student.avatar} alt={student.name} className="h-8 w-8 rounded-full" />
            <span className="hidden text-sm sm:inline">{student.name.split(" ")[0]}</span>
          </Link>
          {open && (
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
