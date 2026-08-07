import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import {
  Home,
  GraduationCap,
  BookOpen,
  ChefHat,
  FileSpreadsheet,
  TrendingUp,
  Award,
  LifeBuoy,
  Library,
  Clapperboard,
  User,
  LogOut,
  Menu,
  X,
  Flame,
  Shield,
  ChevronRight,
  Settings,
  Wallet,
} from "lucide-react";
import { student } from "@/lib/platform-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
  module?: string; // Módulo necessário para acesso
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { to: "/app", label: "Início", icon: Home, exact: true },
      { to: "/app/receitas", label: "Receitas", icon: ChefHat },
      { to: "/app/materiais", label: "Recursos", icon: Library },
    ],
  },
  {
    title: "Aprendizado",
    items: [
      { to: "/app/cursos", label: "Meus cursos", icon: GraduationCap },
      { to: "/app/progresso", label: "Meu progresso", icon: TrendingUp },
    ],
  },
  {
    title: "Conta",
    items: [
      { to: "/app/certificados", label: "Certificados", icon: Award },
      { to: "/app/perfil", label: "Meu perfil", icon: User },
      { to: "/app/suporte", label: "Suporte", icon: LifeBuoy },
      { to: "/app/afiliados", label: "Afiliados", icon: TrendingUp },
      { to: "/app/financeiro", label: "Meu Financeiro", icon: Wallet, module: "financeiro" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { to: "/admin", label: "Painel Central", icon: Shield, badge: "Admin" },
      { to: "/admin/usuarios", label: "Equipe", icon: User, module: "admin_only" }, // Apenas Admin Root
      { to: "/admin/alunos", label: "Alunos", icon: GraduationCap, module: "alunos" },
      { to: "/admin/cursos", label: "Cursos", icon: GraduationCap, module: "conteudo" },
      { to: "/admin/ebooks", label: "E-books", icon: BookOpen, module: "conteudo" },
      { to: "/admin/suporte", label: "Suporte", icon: LifeBuoy, module: "suporte" },
      { to: "/admin/afiliados", label: "Afiliados", icon: TrendingUp, module: "financeiro" }, // Reutilizando permissão financeira ou criando nova? Financeiro parece adequado.
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, role, hasModule } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { unreadCount } = useNotifications();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const SidebarInner = (
    <div className="flex h-dvh flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary">
          <Flame className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-base font-extrabold uppercase leading-none tracking-wide text-sidebar-foreground">
            Espetinho <span className="text-primary">na Veia</span>
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Área de membros
          </div>
        </div>
      </div>

      {/* Student mini card */}
      <div className="mx-3 mt-3 flex shrink-0 items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
        <div className="relative">
          <img src={student.avatar} alt={student.name} className="h-9 w-9 rounded-md object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-sidebar-foreground">{student.name}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Aluno ativo</div>
        </div>
      </div>

      {/* Nav */}
      <nav 
        aria-label="Menu principal"
        className="scrollbar-hidden flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)'
        }}
      >
        {navGroups.filter(g => {
          if (g.title !== "Gestão") return true;
          // Se for grupo Gestão, verifica se é admin, gerente ou agente
          return ["admin", "manager", "agent"].includes(role || "");
        }).map((group) => (
          <div key={group.title} className="mb-4 last:mb-0">
            <div className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/35">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.filter(item => {
                if (!item.module) return true;
                if (item.module === "admin_only") return isAdmin;
                return hasModule(item.module);
              }).map((item) => {
                const active = isActive(item.to, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          active ? "bg-black/20 text-primary-foreground" : "bg-primary/15 text-primary"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Você saiu da plataforma.");
            navigate({ to: "/login" });
          }}
          className="flex h-10 w-full items-center gap-3 rounded-md border border-sidebar-border px-3 text-sm font-medium text-sidebar-foreground/70 transition-colors duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
        >
          <LogOut className="h-4 w-4" />
          Sair da plataforma
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#0a0a0a] text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-white/5 lg:block">
        {SidebarInner}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-white/5 bg-[#0a0a0a]/90 px-4 backdrop-blur lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="grid h-10 w-10 place-items-center rounded-md border border-white/10 lg:hidden touch-target"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r border-white/10 bg-[#0e0e0e]">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu de Navegação</SheetTitle>
              </SheetHeader>
              {SidebarInner}
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-extrabold uppercase tracking-wide sm:text-xl text-foreground">
              Espetinho <span className="text-primary">na Veia</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to="/app/notificacoes"
              className="relative grid h-10 w-10 place-items-center rounded-md border border-white/10 hover:border-primary/50 transition-colors touch-target"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
            <Link
              to="/app/perfil"
              className="flex items-center gap-2 rounded-md border border-white/10 py-1 pl-1 pr-3 transition-colors hover:border-primary/50 touch-target"
            >
            <img src={student.avatar} alt={student.name} className="h-8 w-8 rounded" />
              <span className="hidden text-sm font-medium sm:inline">{student.name.split(" ")[0]}</span>
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-bold sm:text-3xl text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
