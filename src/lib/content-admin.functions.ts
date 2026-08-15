import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { triggerEmailEvent } from "./resend.server";

async function assertAdmin(context: any) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Acesso negado: permissão de administrador necessária.");
}

export const saveLiveClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    scheduled_at: z.string(),
    link: z.string().optional(),
    materials_url: z.string().optional(),
    status: z.enum(['scheduled', 'live', 'completed']).default('scheduled'),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    const isNew = !data.id;
    const { data: result, error } = await supabaseAdmin
      .from('live_classes')
      .upsert(data as any)
      .select()
      .single();
      
    if (error) throw new Error(error.message);

    // Se for uma nova aula e estiver agendada, notifica os alunos
    if (isNew && data.status === 'scheduled') {
      console.log(`[LiveClass] Nova aula criada: ${data.title}. Iniciando notificações...`);
      
      // Busca todos os alunos ativos (profiles de usuários reais)
      const { data: students, error: studentError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, name')
        .not('email', 'is', null);

      if (!studentError && students && students.length > 0) {
        // Envia notificações em background
        (async () => {
          try {
            const results = await Promise.allSettled(students.map(student => 
              triggerEmailEvent({
                event: 'nova_aula_ao_vivo',
                to: student.email!,
                data: {
                  name: student.name || 'Aluno',
                  title: data.title,
                  date: new Date(data.scheduled_at).toLocaleString('pt-BR'),
                  description: data.description || 'Sem descrição.',
                  link: data.link || '#'
                },
                idempotencyKey: `live_${result.id}_${student.id}`
              })
            ));
            const sentCount = results.filter(r => r.status === 'fulfilled').length;
            console.log(`[LiveClass] Notificações enviadas para ${sentCount}/${students.length} alunos.`);
          } catch (notifyErr) {
            console.error('[LiveClass] Erro no fluxo de notificações:', notifyErr);
          }
        })();
      }
    }

    return { success: true };
  });

export const saveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    price: z.number().nullable().optional(),
    is_ai_generated: z.boolean().default(false),
    content_url: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    cover_url: z.string().nullable().optional(),
    teacher_name: z.string().nullable().optional(),
    badge: z.string().nullable().optional(),
    is_locked: z.boolean().default(false),
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await supabaseAdmin
      .from('courses')
      .upsert(data as any);

    if (error) throw new Error(error.message);
    return { success: true };
  });
