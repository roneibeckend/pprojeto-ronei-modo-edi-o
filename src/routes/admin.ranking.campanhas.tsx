import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trophy, Plus, Calendar, Clock, Award, Trash2 } from "lucide-react";
import { getCampaigns, createCampaign, finishCampaign } from "@/lib/campaigns.functions";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/ranking/campanhas")({
  component: AdminCampaigns,
});

function AdminCampaigns() {
  const queryClient = useQueryClient();
  const fetchCampaigns = useServerFn(getCampaigns);
  const addCampaign = useServerFn(createCampaign);
  const endCampaign = useServerFn(finishCampaign);

  const { data: campaigns } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: () => fetchCampaigns()
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    prizeDescription: "",
    rewardedPositions: "1, 2, 3"
  });

  const createMutation = useMutation({
    mutationFn: () => addCampaign({
      name: formData.name,
      description: formData.description,
      startDate: `${formData.startDate}T00:00:00Z`,
      endDate: `${formData.endDate}T23:59:59Z`,
      prizeDescription: formData.prizeDescription,
      rewardedPositions: formData.rewardedPositions.split(',').map(n => parseInt(n.trim()))
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setIsFormOpen(false);
      toast.success("Campanha criada!");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="text-[#ff6a00]" /> Campanhas e Premiações
        </h2>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#ff6a00] text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-[#111] border border-white/10 p-6 rounded-xl space-y-4">
          <input className="w-full bg-black p-3 rounded" placeholder="Nome" onChange={e => setFormData({...formData, name: e.target.value})} />
          <textarea className="w-full bg-black p-3 rounded" placeholder="Descrição" onChange={e => setFormData({...formData, description: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="date" className="bg-black p-3 rounded" onChange={e => setFormData({...formData, startDate: e.target.value})} />
            <input type="date" className="bg-black p-3 rounded" onChange={e => setFormData({...formData, endDate: e.target.value})} />
          </div>
          <input className="w-full bg-black p-3 rounded" placeholder="Premiação" onChange={e => setFormData({...formData, prizeDescription: e.target.value})} />
          <input className="w-full bg-black p-3 rounded" placeholder="Posições Premiadas (ex: 1, 2, 3)" onChange={e => setFormData({...formData, rewardedPositions: e.target.value})} />
          <button onClick={() => createMutation.mutate()} className="bg-[#ff6a00] w-full py-3 rounded font-bold">Salvar</button>
        </div>
      )}

      <div className="grid gap-4">
        {campaigns?.map(c => (
          <div key={c.id} className="bg-[#111] border border-white/10 p-4 rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold">{c.name}</h3>
              <p className="text-xs text-white/50">{format(new Date(c.start_date), "dd/MM")} - {format(new Date(c.end_date), "dd/MM")}</p>
            </div>
            {c.is_active && (
              <button onClick={() => endCampaign({ campaignId: c.id })} className="text-xs bg-red-900/20 text-red-500 px-3 py-1 rounded">Encerrar</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
