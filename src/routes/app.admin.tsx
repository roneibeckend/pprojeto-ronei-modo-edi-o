import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  ArrowLeft,
  Settings,
  ShieldCheck
} from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  component: AdminLayout,
});

const ORANGE = "#ff6a00";

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const navItems = [
    { to: "/app/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/app/admin/financeiro", label: "Financeiro", icon: DollarSign },
    { to: "/app/admin/alunos", label: "Alunos", icon: Users },
  ];

  const isActive = (to: string, exact?: boolean) => 
    exact ? pathname === to : pathname.startsWith(to);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar for Admin */}
      <header className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/app" 
            className="group flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 transition hover:border-[color:var(--orange)]"
            style={{ ["--orange" as any]: ORANGE }}
          >
            <ArrowLeft className="h-5 w-5 text-white/50 transition group-hover:text-[color:var(--orange)]" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-3 w-3" style={{ color: ORANGE }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Área Restrita</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
              Cockpit <span style={{ color: ORANGE }}>Administrativo</span>
            </h1>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-sm border border-white/5 bg-black/40 p-1">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                  active 
                    ? "bg-[#ff6a00] text-black shadow-[0_0_20px_rgba(255,106,0,0.3)]" 
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
          <div className="mx-1 h-6 w-px bg-white/10" />
          <button className="flex h-8 w-8 items-center justify-center rounded-sm text-white/30 transition hover:bg-white/5 hover:text-white">
            <Settings className="h-4 w-4" />
          </button>
        </nav>
      </header>

      {/* Admin Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Outlet />
      </div>
    </div>
  );
}
