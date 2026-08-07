import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: userNotifications = [] } = useQuery({
    queryKey: ["user_notifications", user?.id || "anonymous"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(
    (n) => !userNotifications.some((un) => un.notification_id === n.id && un.read_at)
  ).length;

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("user_notifications").upsert(
        {
          user_id: user.id,
          notification_id: notificationId,
          read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,notification_id" }
      );

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["user_notifications", user?.id || "anonymous"] });
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          
          const newNotif = payload.new as any;
          toast(newNotif.title, {
            description: newNotif.message,
            icon: <Bell className="h-4 w-4 text-[#ff6a00]" />,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
  };
}