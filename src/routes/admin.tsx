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
  DollarSign,
  HelpCircle,
  Bell,
  FileText,
  Wallet,
  TrendingUp,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  component: AdminRootLayout,
});

const ORANGE = "#ff6a00";

function AdminRootLayout() {
  const navigate = useNavigate();
  const { isAdmin, role, isLoading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && !isAdmin && !["manager", "agent", "student"].includes(role || "")) {
      navigate({ to: "/app", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  if (!isAdmin && !["manager", "agent", "student"].includes(role || "")) return null;

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/financeiro", label: "Financeiro", icon: DollarSign, exact: true },
    { to: "/admin/financeiro/saques", label: "Gestão de Saques", icon: Wallet },
    { to: "/admin/cursos", label: "Cursos", icon: Library },
    { to: "/admin/ebooks", label: "eBooks", icon: BookOpen },
    { to: "/admin/afiliados", label: "Afiliados", icon: TrendingUp },
    { to: "/admin/receitas", label: "Receitas", icon: ChefHat },
    
    { to: "/admin/ao-vivo", label: "Ao Vivo", icon: Clapperboard },
    
    { to: "/admin/alunos", label: "Alunos", icon: Users },
    { to: "/admin/suporte", label: "Suporte", icon: HelpCircle },
    { to: "/admin/integracoes", label: "Integrações", icon: Settings },
    { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
    { to: "/admin/relatorios", label: "Relatórios", icon: FileText },
  ];

  return (
    <div className="flex h-dvh bg-[#0a0a0a] text-white overflow-hidden safe-top safe-bottom">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-2 shrink-0">
          <ShieldCheck className="h-6 w-6" style={{ color: ORANGE }} />
          <span className="font-bold tracking-widest text-sm uppercase truncate">
            {role === "student" ? "Painel Central" : "Painel Admin"}
          </span>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-hidden">
          {navItems.filter(item => {
            if (role !== "student") return true;
            // Para alunos, só o dashboard principal e talvez financeiro se tiver módulo?
            // Mas o requisito diz: "Se o usuário for um aluno comum, o clique em 'GESTAO' deve levar apenas ao 'painel central'."
            return item.to === "/admin";
          }).map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition shrink-0 ${
                  active ? "bg-[#ff6a00]/10 text-[#ff6a00]" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <Link to="/app" className="flex items-center gap-2 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao App
          </Link>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      <div className="lg:hidden flex items-center p-4 border-b border-white/10 absolute top-0 w-full z-10 bg-[#0a0a0a]">
        <Sheet>
          <SheetTrigger className="p-2">
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#0a0a0a] border-white/10 w-64 p-0">
            <nav className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-hidden mt-12">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition shrink-0 ${
                      active ? "bg-[#ff6a00]/10 text-[#ff6a00]" : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="font-bold tracking-widest text-[10px] sm:text-sm uppercase ml-4 truncate flex-1 pr-4">Painel Administrativo</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-0 w-full">
        <header className="p-8 border-b border-white/10 hidden lg:block">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            Painel Central <span style={{ color: ORANGE }}>Administrativo</span>
          </h1>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
