import { Link, useRouterState } from "@tanstack/react-router";
import { 
  Home, 
  GraduationCap, 
  ChefHat, 
  Library, 
  User,
  LayoutDashboard,
  DollarSign,
  Users,
  Shield,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin, role } = useAuth();
  
  const isAdminPath = pathname.startsWith("/admin");
  const isAppPath = pathname.startsWith("/app") || pathname === "/inicio";

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const appItems: NavItem[] = [
    { to: "/app", label: "Início", icon: Home, exact: true },
    { to: "/app/cursos", label: "Cursos", icon: GraduationCap },
    { to: "/app/receitas", label: "Receitas", icon: ChefHat },
    { to: "/app/materiais", label: "Materiais", icon: Library },
    { to: "/app/perfil", label: "Perfil", icon: User },
  ];

  const adminItems: NavItem[] = [
    { to: "/admin", label: "Geral", icon: LayoutDashboard, exact: true },
    { to: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
    { to: "/admin/alunos", label: "Alunos", icon: Users },
    { to: "/admin/cursos", label: "Catálogo", icon: GraduationCap },
    { to: "/app", label: "Sair Admin", icon: Shield },
  ];

  const items = isAdminPath ? adminItems : (isAppPath ? appItems : []);

  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-lg lg:hidden safe-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 transition-colors ${
                active ? "text-primary" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-tight uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
