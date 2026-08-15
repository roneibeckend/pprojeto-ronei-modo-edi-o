
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getResendIntegration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('category', 'resend')
      .maybeSingle();

    if (error) throw error;
    return data;
  });
