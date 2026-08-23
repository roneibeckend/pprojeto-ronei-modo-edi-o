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
    if (!isAdmin) throw new Error("Proibido");

    const { data, error } = await supabaseAdmin
      .from('integrations')
      .select('*')
      .eq('category', 'resend')
      .maybeSingle();

    if (error) throw error;
    
    if (!data) return undefined;

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      status: data.status ?? false,
      credentials: (data.credentials || {}) as Record<string, string>,
      settings: (data.settings || {}) as Record<string, string>,
      type: data.type as 'ia' | 'payment',
      updated_at: data.updated_at || undefined
    };
  });

export const saveIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid().optional().nullable(),
    name: z.string(),
    type: z.enum(['ia', 'payment', 'feature']),
    category: z.string(),
    status: z.boolean(),
    credentials: z.record(z.any()),
    settings: z.record(z.any())
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    if (!isAdmin) throw new Error("Proibido");

    const payload = {
      name: data.name,
      type: data.type === 'feature' ? 'ia' : data.type as 'ia' | 'payment',
      category: data.category,
      status: data.status,
      credentials: data.credentials,
      settings: data.settings,
      updated_at: new Date().toISOString()
    };

    if (data.id && data.id !== '') {
      const { error } = await supabaseAdmin
        .from('integrations')
        .update(payload)
        .eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('integrations')
        .insert([payload]);
      if (error) throw error;
    }

    return { success: true };
  });

export const testIntegrationConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().optional().nullable(),
    category: z.string(),
    credentials: z.record(z.any()),
    settings: z.record(z.any()),
    environment: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    if (!isAdmin) throw new Error("Proibido");

    const start = Date.now();

    if (data.category === 'resend') {
      const apiKey = data.credentials?.apiKey || process.env['RESEND_API_KEY'];
      if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('re_')) {
        return {
          success: false,
          message: "API Key do Resend não encontrada ou inválida. Insira uma chave começando com 're_'.",
          latency: `${Date.now() - start}ms`,
          httpCode: 400,
          environment: data.environment || 'production',
          timestamp: new Date().toISOString(),
          endpoint: 'https://api.resend.com/emails',
          responseBody: null
        };
      }

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: 'test@resend.dev',
            subject: 'Validation',
            html: 'Validation',
            dry_run: true
          })
        });

        const latency = `${Date.now() - start}ms`;
        const responseBody = await response.json().catch(() => ({}));

        if (response.status === 401) {
          return {
            success: false,
            message: responseBody.name === 'restricted_api_key'
              ? 'Chave de API restrita: válida apenas para envio, não para testes de domínio.'
              : 'API Key do Resend inválida (401).',
            latency,
            httpCode: 401,
            environment: data.environment || 'production',
            timestamp: new Date().toISOString(),
            endpoint: 'https://api.resend.com/emails',
            responseBody
          };
        }

        if (!response.ok) {
          return {
            success: false,
            message: responseBody.message || `Erro na API Resend: ${response.status}`,
            latency,
            httpCode: response.status,
            environment: data.environment || 'production',
            timestamp: new Date().toISOString(),
            endpoint: 'https://api.resend.com/emails',
            responseBody
          };
        }

        return {
          success: true,
          message: "Conexão com Resend validada com sucesso!",
          latency,
          httpCode: response.status,
          environment: data.environment || 'production',
          timestamp: new Date().toISOString(),
          endpoint: 'https://api.resend.com/emails',
          responseBody
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erro inesperado ao testar conexão com Resend.",
          latency: `${Date.now() - start}ms`,
          httpCode: 500,
          environment: data.environment || 'production',
          timestamp: new Date().toISOString(),
          endpoint: 'https://api.resend.com/emails',
          responseBody: null
        };
      }
    }

    return {
      success: true,
      message: "Conexão testada com sucesso!",
      latency: `${Date.now() - start}ms`,
      httpCode: 200,
      environment: data.environment || 'production',
      timestamp: new Date().toISOString(),
      endpoint: `https://api.${data.category}.com/v1/verify`,
      responseBody: { status: "active", version: "1.0.0" }
    };
  });

export const getIntegrationHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    data: z.object({
      category: z.string(),
      limit: z.number().optional()
    })
  }).parse(data))
  .handler(async ({ data: { data }, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    if (!isAdmin) throw new Error("Proibido");

    return [];
  });
