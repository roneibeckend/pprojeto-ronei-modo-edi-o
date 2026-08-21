import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Library, 
  BookOpen, 
  Users, 
  Settings,
  ShieldCheck,
  ChefHat,
  ArrowLeft,
  ChevronLeft,
  Loader2,
  BrainCircuit,
  Clapperboard,
  Bell,
  HelpCircle,
  DollarSign,
  FileText,
  Wallet,
  TrendingUp,
  Menu,
  Star,
  Terminal
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/platform/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export const Route = createFileRoute("/admin")({
  component: AdminRootLayout,
});

const ORANGE = "#ff6a00";

function AdminRootLayout() {
  const navigate = useNavigate();
  const { isAdmin, role, isLoading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (isLoading) return;
    const isStaff = isAdmin || ["manager", "agent"].includes(role || "");
    if (!isStaff && role !== "student") {
      navigate({ to: "/app", replace: true });
      return;
    }
    // Aluno só pode ver o painel central (/admin); sub-rotas de gestão são exclusivas da equipe.
    if (!isStaff && role === "student" && pathname !== "/admin") {
      navigate({ to: "/admin", replace: true });
    }
  }, [isAdmin, role, isLoading, navigate, pathname]);


  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  if (!isAdmin && !["manager", "agent", "student"].includes(role || "")) return null;

  const navItems = [
    { to: "/admin", label: "Visão Geral", icon: LayoutDashboard, exact: true },
    { to: "/admin/financeiro", label: "Financeiro", icon: DollarSign, exact: true },
    { to: "/admin/financeiro/saques", label: "Gestão de Saídas", icon: Wallet },
    { to: "/admin/cursos", label: "Catálogo", icon: Library },
    { to: "/admin/ebooks", label: "eBooks", icon: BookOpen },
    { to: "/admin/afiliados", label: "Afiliados", icon: TrendingUp },
    { to: "/admin/receitas", label: "Receitas", icon: ChefHat },
    
    { to: "/admin/ao-vivo", label: "Ao Vivo", icon: Clapperboard },
    
    { to: "/admin/alunos", label: "Alunos", icon: Users },
    { to: "/admin/feedbacks", label: "Feedbacks", icon: Star },
    { to: "/admin/suporte", label: "Suporte", icon: HelpCircle },

    { to: "/admin/integracoes", label: "Integrações", icon: Settings },
    { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
    { to: "/admin/relatorios", label: "Relatórios", icon: FileText },
    { to: "/admin/materiais", label: "Materiais", icon: Library },
    { to: "/admin/ranking", label: "Ranking", icon: Star, subItems: [
      { to: "/admin/ranking", label: "Configuração", exact: true },
      { to: "/admin/ranking/campanhas", label: "Campanhas", exact: true },
      { to: "/admin/ranking/campanhas", label: "Premiações", exact: true },
    ]},
    { to: "/admin/chatbot", label: "Inteligência Brasa", icon: BrainCircuit },
    { to: "/admin/logs", label: "Logs do Sistema", icon: Terminal },
  ];

  const isMobile = useIsMobile();
  const { isStandalone } = usePwaInstall();
  const isPwa = isStandalone;
  const isMobileOrPwa = isMobile || isPwa;

  return (
    <div className="flex h-dvh bg-[#0a0a0a] text-white overflow-hidden safe-top safe-bottom">
      {/* Sidebar - Desktop - Hidden if Mobile or PWA */}
      {!isMobileOrPwa && (
        <aside className="hidden lg:flex w-64 border-r border-white/10 flex-col shrink-0">
          <div className="p-6 border-b border-white/10 flex items-center gap-2 shrink-0 h-20">
            <ShieldCheck className="h-6 w-6" style={{ color: ORANGE }} />
            <span className="font-bold tracking-widest text-sm uppercase truncate">
              {role === "student" ? "Painel Central" : "Painel Admin"}
            </span>
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-hidden">
            {navItems.filter(item => {
              if (role !== "student") return true;
              // Para alunos, só o dashboard principal
              return item.to === "/admin";
            }).map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              
              return (
                <div key={item.to} className="space-y-1">
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition shrink-0 ${
                      active ? "bg-[#ff6a00]/10 text-[#ff6a00]" : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{item.label}</span>
                  </Link>

                  {/* Submenu para o Ranking */}
                  {item.subItems && active && (
                    <div className="ml-9 space-y-1 animate-in slide-in-from-left-2 duration-200">
                      {item.subItems.map((sub) => {
                        const isSubActive = sub.exact ? pathname === sub.to : pathname.startsWith(sub.to);
                        return (
                          <Link
                            key={`${item.to}-${sub.label}`}
                            to={sub.to}
                            className={`block px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                              isSubActive ? "text-[#ff6a00]" : "text-white/40 hover:text-white/70"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 shrink-0">
            <Link to="/app" className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao App
            </Link>
          </div>
        </aside>
      )}

      {/* Sidebar - Mobile - Hidden if PWA (uses BottomNav) or just keep header minimal */}
      {!isPwa && (
        <div className="lg:hidden flex items-center p-4 border-b border-white/10 absolute top-0 w-full z-10 bg-[#0a0a0a]">
          <Sheet>
            <SheetTrigger className="p-2">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0a0a0a] border-white/10 w-64 p-0">
              <nav className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-hidden mt-12">
                {navItems.filter(item => {
                  if (role !== "student") return true;
                  return item.to === "/admin";
                  }).map((item) => {
                    const Icon = item.icon;
                    const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                    return (
                      <div key={item.to} className="space-y-1">
                        <Link
                          to={item.to}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition shrink-0 ${
                            active ? "bg-[#ff6a00]/10 text-[#ff6a00]" : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Link>

                        {/* Submenu Mobile */}
                        {item.subItems && active && (
                          <div className="ml-12 space-y-1">
                            {item.subItems.map((sub) => {
                              const isSubActive = pathname === sub.to;
                              return (
                                <Link
                                  key={`${item.to}-${sub.label}-mobile`}
                                  to={sub.to}
                                  className={`block px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                                    (sub.exact ? pathname === sub.to : pathname.startsWith(sub.to)) ? "text-[#ff6a00]" : "text-white/40 hover:text-white/70"
                                  }`}
                                >
                                  {sub.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </nav>
            </SheetContent>
          </Sheet>
          <span className="font-bold tracking-widest text-[10px] sm:text-sm uppercase ml-4 truncate flex-1 pr-4">Painel Administrativo</span>
          <div className="flex items-center gap-2">
            <Link 
              to="/admin/notificacoes"
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 hover:border-[#ff6a00]/50 hover:text-[#ff6a00] transition-colors touch-target"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}

      {/* PWA Header (Minimal) */}
      {isPwa && (
        <div className="lg:hidden flex items-center p-4 border-b border-white/10 absolute top-0 w-full z-10 bg-[#0a0a0a] pt-safe">
           <span className="font-bold tracking-widest text-[10px] sm:text-sm uppercase truncate flex-1 pr-4">Painel Administrativo</span>
           <div className="flex items-center gap-2">
            <Link 
              to="/admin/notificacoes"
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 hover:border-[#ff6a00]/50 hover:text-[#ff6a00] transition-colors touch-target"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-0 w-full">
        <header className="px-8 border-b border-white/10 hidden lg:flex items-center justify-between shrink-0 h-20">
          <h1 className="font-display text-xl font-extrabold uppercase tracking-tight">
            {role === "student" ? "Painel Central" : (
              <>Painel Central <span style={{ color: ORANGE }}>Administrativo</span></>
            )}
          </h1>
          <div className="flex items-center gap-3">
            <Link 
              to="/admin/notificacoes"
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 hover:border-[#ff6a00]/50 hover:text-[#ff6a00] transition-colors"
              title="Notificações"
            >
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 3xl:max-w-[1800px] 3xl:mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
