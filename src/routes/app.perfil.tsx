import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/platform/Shell";
import { useProfile } from "@/hooks/use-queries";
import { useCourses } from "@/hooks/use-queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Espetinho na Veia" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile, isLoading, refetch } = useProfile();
  const { data: courses } = useCourses();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Meu perfil" subtitle="Gerencie seus dados e preferências." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="glass rounded-2xl p-6 text-center">
          <img 
            src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || 'User'}&backgroundColor=e11d48`} 
            alt={profile?.name} 
            className="mx-auto h-28 w-28 rounded-full ring-4 ring-primary/30" 
          />
          <h3 className="mt-4 font-display text-2xl font-bold">{profile?.name || "Usuário"}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Aluno desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "—"}
          </p>
          <button className="btn-ghost-fire mt-6 w-full text-sm">Trocar foto</button>
        </section>

        <section className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold">Dados pessoais</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field 
                label="Nome completo" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Field 
                label="Telefone" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <button 
              className="btn-fire mt-6 text-sm flex items-center gap-2" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </button>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold">Cursos adquiridos</h3>
            <ul className="mt-3 space-y-2">
              {courses?.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 p-3 text-sm">
                  <span>{c.title}</span>
                  <span className="text-xs text-muted-foreground">Acessado</span>
                </li>
              ))}
              {(!courses || courses.length === 0) && (
                <li className="text-sm text-muted-foreground text-center py-4 italic">
                  Nenhum curso encontrado.
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, ...rest }: { label: string; value?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input {...rest} value={value ?? ""} className="w-full rounded-xl border border-white/10 bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary" />
    </label>
  );
}
