import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Link as LinkIcon, 
  Copy, 
  ExternalLink, 
  Plus, 
  Loader2,
  Check,
  Globe
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/afiliados/links")({
  component: AffiliateLinksPage,
});

function AffiliateLinksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: links, isLoading } = useQuery({
    queryKey: ["affiliate-links", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select(`
          *,
          course:courses(title)
        `)
        .eq("affiliate_id", user?.id as string)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: courses } = useQuery({
    queryKey: ["available-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, title");
      if (error) throw error;
      return data;
    }
  });

  const createLinkMutation = useMutation({
    mutationFn: async (courseId: string | null) => {
      const code = `${user?.id?.slice(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { data, error } = await supabase.from("affiliate_links").insert({
        affiliate_id: user?.id as string,
        course_id: courseId,
        code: code
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      toast.success("Link gerado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao gerar link: " + error.message);
    }
  });

  const copyToClipboard = (code: string, id: string) => {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left overflow-x-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl font-bold break-words">Seus Links de Divulgação</h2>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
           <div className="flex-1 min-w-0 bg-fire/5 border border-fire/20 p-3 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0 overflow-hidden">
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-fire truncate">Link de Indicação (Afiliados)</div>
                <div className="text-xs text-white/60 truncate">{window.location.origin}/auth?ref={user?.id?.slice(0, 8)}</div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${user?.id?.slice(0, 8)}`);
                  toast.success("Link de indicação copiado!");
                }}
                className="p-2 hover:bg-fire/10 rounded-lg text-fire transition shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
           </div>
           <button 
            onClick={() => createLinkMutation.mutate(null)}
            disabled={createLinkMutation.isPending}
            className="btn-ghost-fire text-xs flex items-center justify-center gap-2 h-fit w-full py-3 sm:py-2.5"
          >
            <Globe className="w-4 h-4" /> Gerar Link Global
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass p-5 sm:p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-base">
            <Plus className="w-4 h-4 text-fire" /> Gerar Link por Curso
          </h3>
          <div className="space-y-3">
            {courses?.map(course => {
              const hasLink = links?.some(l => l.course_id === course.id);
              return (
                <div key={course.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 gap-3">
                  <span className="text-sm font-medium truncate flex-1 min-w-0">{course.title}</span>
                  <button 
                    disabled={hasLink || createLinkMutation.isPending}
                    onClick={() => createLinkMutation.mutate(course.id)}
                    className="p-2 rounded-lg bg-fire/10 text-fire hover:bg-fire/20 transition disabled:opacity-30"
                  >
                    {hasLink ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          {links && links.length > 0 ? (
            links.map((link) => (
              <div key={link.id} className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="bg-fire/20 p-2.5 rounded-lg shrink-0">
                      <LinkIcon className="w-4 h-4 text-fire" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <h4 className="font-bold text-sm truncate leading-tight mb-1">
                        {link.course ? `Curso: ${link.course.title}` : "Link Global / Home"}
                      </h4>
                      <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                        Código: {link.code}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 shrink-0 bg-white/5 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                    <div className="text-xl sm:text-2xl font-display font-black text-white leading-none">{link.clicks || 0}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Cliques</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-3 sm:py-2 text-xs text-white/40 truncate flex items-center min-h-[44px]">
                    {window.location.origin}/?ref={link.code}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(link.code, link.id)}
                      className="flex-1 sm:flex-none p-3 sm:p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition flex items-center justify-center min-w-[44px] min-h-[44px]"
                    >
                      {copiedId === link.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a 
                      href={`${window.location.origin}/?ref=${link.code}`}
                      target="_blank"
                      className="flex-1 sm:flex-none p-3 sm:p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition flex items-center justify-center min-w-[44px] min-h-[44px]"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass p-10 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
               <LinkIcon className="w-10 h-10 text-white/10 mb-4" />
               <p className="text-sm text-muted-foreground">Nenhum link gerado ainda.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
