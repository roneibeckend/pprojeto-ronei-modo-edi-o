import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Loader2,
  UserCheck,
  Ban,
  Settings
} from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/afiliados")({
  component: AdminAffiliatesPage,
});

function AdminAffiliatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select(`
          *,
          profile:profiles(name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'blocked' | 'pending' }) => {
      const { error } = await supabase
        .from("affiliates")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar: " + error.message);
    }
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: string; rate: number }) => {
      const { error } = await supabase
        .from("affiliates")
        .update({ commission_rate: rate })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast.success("Comissão atualizada!");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    }
  });

  const filtered = affiliates?.filter(a => 
    a.profile?.name?.toLowerCase().includes(search.toLowerCase()) || 
    a.profile?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <PageHeader 
        title="Gestão de Afiliados" 
        subtitle="Aprove, bloqueie e gerencie as taxas de comissão dos seus parceiros." 
      />

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-white/20" />
        <input 
          placeholder="Buscar afiliado por nome ou e-mail..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 py-3 pl-10 pr-4 rounded-xl text-sm outline-none focus:border-fire/50" 
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-fire" />
        </div>
      ) : (
        <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#111]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-white/40">
                <th className="px-6 py-4">Afiliado</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Comissão (%)</th>
                <th className="px-6 py-4">Ganhos / Saldo</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered && filtered.length > 0 ? (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{a.profile?.name || "Sem Nome"}</div>
                      <div className="text-xs text-white/40">{a.profile?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        a.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        a.status === 'blocked' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {a.status === 'active' ? 'Ativo' : a.status === 'blocked' ? 'Bloqueado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" 
                           defaultValue={a.commission_rate}
                           onBlur={(e) => updateCommissionMutation.mutate({ id: a.id, rate: parseFloat(e.target.value) })}
                           className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs"
                         />
                         <span className="text-white/40 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-bold">R$ {a.total_earnings?.toFixed(2)}</div>
                      <div className="text-fire text-xs font-bold">Saldo: R$ {a.balance?.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status !== 'active' && (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: a.id, status: 'active' })}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition"
                            title="Aprovar / Ativar"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {a.status !== 'blocked' && (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: a.id, status: 'blocked' })}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                            title="Bloquear"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    Nenhum afiliado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
