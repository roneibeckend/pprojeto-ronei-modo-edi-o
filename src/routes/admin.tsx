import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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
  Wallet
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: AdminRootLayout,
});

const ORANGE = "#ff6a00";

function AdminRootLayout() {
  const navigate = useNavigate();
  const { isAdmin, role, isLoading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && !isAdmin && !["manager", "agent"].includes(role || "")) {
      navigate({ to: "/app", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6a00]" />
      </div>
    );
  }

  if (!isAdmin && !["manager", "agent"].includes(role || "")) return null;

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/financeiro", label: "Financeiro", icon: DollarSign, exact: true },
    { to: "/admin/financeiro/saques", label: "Gestão de Saques", icon: Wallet },
    { to: "/admin/cursos", label: "Cursos", icon: Library },
    { to: "/admin/receitas", label: "Receitas", icon: ChefHat },
    
    { to: "/admin/ao-vivo", label: "Ao Vivo", icon: Clapperboard },
    
    { to: "/admin/alunos", label: "Alunos", icon: Users },
    { to: "/admin/suporte", label: "Suporte", icon: HelpCircle },
    { to: "/admin/integracoes", label: "Integrações", icon: Settings },
    { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
    { to: "/admin/relatorios", label: "Relatórios", icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" style={{ color: ORANGE }} />
          <span className="font-bold tracking-widest text-sm uppercase">Painel Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  active ? "bg-[#ff6a00]/10 text-[#ff6a00]" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link to="/app" className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" /> Voltar ao App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="p-8 border-b border-white/10">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            Painel Central <span style={{ color: ORANGE }}>Administrativo</span>
          </h1>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
