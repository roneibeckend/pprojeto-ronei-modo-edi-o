import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { grantAccess } from "./asaas.server";

export const manualConfirmEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    studentId: z.string().uuid(),
    productId: z.string().uuid(),
    productType: z.enum(['course', 'ebook']),
    notes: z.string().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    // 1. Verify admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Acesso negado: apenas administradores podem realizar confirmações manuais.");
    }

    // 2. Check if already enrolled
    let existing;
    if (data.productType === 'course') {
      const { data: found } = await supabaseAdmin
        .from('course_enrollments')
        .select('id')
        .eq('user_id', data.studentId)
        .eq('course_id', data.productId)
        .maybeSingle();
      existing = found;
    } else {
      const { data: found } = await supabaseAdmin
        .from('ebook_enrollments')
        .select('id')
        .eq('user_id', data.studentId)
        .eq('ebook_id', data.productId)
        .maybeSingle();
      existing = found;
    }

    if (existing) {
      throw new Error("O aluno já possui acesso a este conteúdo.");
    }

    // 3. Grant access
    const success = await grantAccess(data.productType, data.productId, data.studentId);
    
    if (!success) {
      throw new Error("Falha ao criar a matrícula no banco de dados.");
    }

    // 4. Log the action (Audit)
    await supabaseAdmin.from('integration_logs').insert({
      integration_name: 'manual_enrollment',
      status: 'success',
      message: `Matrícula manual realizada pelo admin ${context.userId}`,
      details: {
        admin_id: context.userId,
        student_id: data.studentId,
        product_id: data.productId,
        product_type: data.productType,
        notes: data.notes || '',
        timestamp: new Date().toISOString()
      },
      user_id: data.studentId
    });

    return { success: true };
  });
