import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check, Clock, Info, Library, Play, Clapperboard } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { PageHeader } from "@/components/platform/Shell";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/notificacoes")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, markAsRead, isLoading } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "course": return Library;
      case "lesson": return Play;
      case "live": return Clapperboard;
      default: return Info;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "course": return "text-purple-400";
      case "lesson": return "text-green-400";
      case "live": return "text-red-400";
      default: return "text-blue-400";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Notificações" 
        subtitle="Fique por dentro das últimas novidades da plataforma."
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <Bell className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold">Nenhuma notificação</h3>
          <p className="text-white/40">Você está em dia com todas as novidades.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const colorClass = getColor(notification.type);
            
            return (
              <div 
                key={notification.id}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-4">
                  <div className={`h-12 w-12 shrink-0 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate group-hover:text-primary transition">
                        {notification.title}
                      </h3>
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
