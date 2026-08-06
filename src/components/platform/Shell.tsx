import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
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
  ChevronRight,
  Settings,
} from "lucide-react";
import { student } from "@/lib/platform-data";
import { supabase } from "@/integrations/supabase/client";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { to: "/app", label: "Início", icon: Home, exact: true },
      { to: "/app/progresso", label: "Meu progresso", icon: TrendingUp },
    ],
  },
  {
    title: "Aprendizado",
    items: [
      { to: "/app/cursos", label: "Meus cursos", icon: GraduationCap },
      { to: "/app/ebooks", label: "Biblioteca de e-books", icon: BookOpen },
      { to: "/app/receitas", label: "Receitas", icon: ChefHat },
      { to: "/app/materiais", label: "Planilhas e materiais", icon: FileSpreadsheet },
    ],
  },
  {
    title: "Conta",
    items: [
      { to: "/app/certificados", label: "Certificados", icon: Award },
      { to: "/app/perfil", label: "Meu perfil", icon: User },
      { to: "/app/suporte", label: "Suporte", icon: LifeBuoy },
    ],
  },
  {
    title: "Gestão",
    items: [
      { to: "/app/admin", label: "Painel Admin", icon: Shield, badge: "Admin" },
      { to: "/app/admin/integracoes", label: "Integrações", icon: Settings },
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const SidebarInner = (
    <div className="flex h-full flex-col bg-[#0e0e0e]">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#ff6a00]">
          <Flame className="h-5 w-5 text-black" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-[17px] font-extrabold uppercase leading-none tracking-wide text-white">
            Espetinho <span className="text-[#ff6a00]">na Veia</span>
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Área de membros
          </div>
        </div>
      </div>

      {/* Student mini card */}
      <div className="mx-3 mt-3 flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
        <div className="relative">
          <img src={student.avatar} alt={student.name} className="h-9 w-9 rounded-md object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0e0e0e] bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{student.name}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#ff6a00]">Aluno ativo</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.to, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#ff6a00] text-black"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-[#ff6a00]" />
                    )}
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                          active ? "bg-black/20 text-black" : "bg-[#ff6a00]/15 text-[#ff6a00]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {!item.badge && (
                      <ChevronRight
                        className={`ml-auto h-3.5 w-3.5 transition ${
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                        }`}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Você saiu da plataforma.");
            navigate({ to: "/login" });
          }}
          className="flex w-full items-center gap-3 rounded-md border border-white/5 px-3 py-2.5 text-sm font-medium text-white/70 transition hover:border-[#ff6a00]/50 hover:bg-[#ff6a00]/10 hover:text-[#ff6a00]"
        >
          <LogOut className="h-4 w-4" />
          Sair da plataforma
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0a] text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/5 lg:block">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/10">
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur lg:px-8">
          <button
            className="grid h-10 w-10 place-items-center rounded-md border border-white/10 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-extrabold uppercase tracking-wide sm:text-xl">
              Espetinho <span className="text-[#ff6a00]">na Veia</span>
            </div>
          </div>
          <Link
            to="/app/perfil"
            className="flex items-center gap-2 rounded-md border border-white/10 py-1 pl-1 pr-3 transition hover:border-[#ff6a00]/50"
          >
            <img src={student.avatar} alt={student.name} className="h-8 w-8 rounded" />
            <span className="hidden text-sm font-medium sm:inline">{student.name.split(" ")[0]}</span>
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
