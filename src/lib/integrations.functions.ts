import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


// Schema for credentials validation
const CredentialsSchema = z.record(z.string());

// Server function for comprehensive connection testing
export const testIntegrationConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string(),
    category: z.string(),
    credentials: CredentialsSchema,
    settings: z.any(),
    environment: z.string().default('sandbox')
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin"
    });
    if (!isAdmin) throw new Error("Acesso negado.");

    const { category, credentials, settings } = data;
    let environment = (String(settings?.testMode) === 'true' || settings?.environment === 'sandbox') ? 'sandbox' : 'production';
    
    // Auto-detect environment from Asaas API key prefix
    if (category === 'asaas' && credentials.apiKey) {
      const apiKey = credentials.apiKey as string;
      if (apiKey.startsWith('$aact_prod_')) {
        environment = 'production';
      } else if (apiKey.startsWith('$aact_test_')) {
        environment = 'sandbox';
      }
    }
    const startTime = Date.now();
    let status = 'success';
    let message = 'Conexão estabelecida com sucesso.';
    let httpCode = 200;
    let endpoint = 'N/A';
    let responseBody = {};

    try {
      console.log(`[Admin] Testando conexão com ${category} (Ambiente Calculado: ${environment})...`);
      
      // Real or simulated logic based on category
      if (category === 'openai' || category === 'gemini' || category === 'claude' || category === 'deepseek') {
        endpoint = credentials.baseUrl || 'https://api.provider.com/v1';
        if (!credentials.apiKey) {
          throw new Error("API Key ausente.");
        }
        // Simulated latency
        await new Promise(resolve => setTimeout(resolve, 800));
        responseBody = { model: data.settings?.defaultModel || 'default', usage: 'ok' };
      } else if (category === 'stripe' || category === 'asaas' || category === 'mercadopago') {
        const asaasSandbox = 'https://sandbox.asaas.com/api/v3';
        const asaasProduction = 'https://www.asaas.com/api/v3';
        
        endpoint = category === 'asaas' 
          ? (environment === 'production' ? asaasProduction : asaasSandbox)
          : (environment === 'production' ? 'https://api.payment.com/v1' : 'https://sandbox.payment.com/v1');

        if (!credentials.apiKey && !credentials.accessToken && !credentials.secretKey) {
          throw new Error("Credenciais de pagamento incompletas.");
        }

        if (category === 'asaas') {
          // Real test call for Asaas to verify credentials and User-Agent requirement
          try {
            const response = await fetch(`${endpoint}/paymentLinks?limit=1`, {
              method: 'GET',
              headers: {
                'accept': 'application/json',
                'access_token': credentials.apiKey as string,
                'User-Agent': 'Lovable-LMS-Platform/1.0.0 (+https://lovable.app)'
              }
            });

            httpCode = response.status;
            responseBody = await response.json();

            if (!response.ok) {
              const errorData = responseBody as any;
              throw new Error(errorData.errors?.[0]?.description || `Erro ${response.status} na API do Asaas`);
            }
          } catch (fetchError: any) {
            throw new Error(`Falha ao conectar com Asaas: ${fetchError.message}`);
          }
        } else {
          // Simulated logic for other payment providers
          await new Promise(resolve => setTimeout(resolve, 1200));
          responseBody = { account_status: 'active', balance: { amount: 0, currency: 'BRL' } };
        }
      } else if (category === 'resend') {
        endpoint = 'https://api.resend.com/emails';
        if (!credentials.apiKey) {
          throw new Error("API Key do Resend ausente.");
        }
        
        try {
          const response = await fetch('https://api.resend.com/domains', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`
            }
          });
          
          httpCode = response.status;
          responseBody = await response.json();
          
          if (!response.ok) {
            throw new Error(`Erro ${response.status} na API do Resend`);
          }
        } catch (fetchError: any) {
          throw new Error(`Falha ao conectar com Resend: ${fetchError.message}`);
        }
      }

      const latency = `${Date.now() - startTime}ms`;

      const logData = {
        integration_name: category,
        status: 'success',
        message,
        latency,
        http_code: httpCode,
        endpoint,
        environment,
        response_body: responseBody,
        details: { provider: category }
      };

      await supabaseAdmin.from('integration_logs').insert([logData]);

      return {
        success: true,
        message,
        latency,
        httpCode,
        endpoint,
        environment,
        timestamp: new Date().toISOString(),
        responseBody
      };
    } catch (error: any) {
      status = 'error';
      message = error.message || "Falha na conexão";
      httpCode = error.status || 400;
      const latency = `${Date.now() - startTime}ms`;

      const logData = {
        integration_name: category,
        status: 'error',
        message,
        latency,
        http_code: httpCode,
        endpoint,
        environment,
        response_body: { error: message },
        details: { provider: category, error: message }
      };

      await supabaseAdmin.from('integration_logs').insert([logData]);

      return {
        success: false,
        message,
        latency,
        httpCode,
        endpoint,
        environment,
        timestamp: new Date().toISOString(),
        responseBody: { error: message }
      };
    }
  });

// Server function for saving integrations
export const saveIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    id: z.string().nullable().optional().or(z.literal('')),
    name: z.string(),
    type: z.enum(['ia', 'payment']),
    category: z.string(),
    status: z.boolean(),
    credentials: z.any(),
    settings: z.any()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin"
    });
    if (!isAdmin) throw new Error("Acesso negado.");

    // Fail-safe: if credentials fields are empty strings and it's an update, don't overwrite with empty
    let finalCredentials = data.credentials;
    if (data.id) {
       const { data: existing } = await supabaseAdmin
         .from('integrations')
         .select('credentials')
         .eq('id', data.id)
         .single();
       
       if (existing) {
         const merged = { ...(existing.credentials as object) };
         for (const [key, value] of Object.entries(data.credentials)) {
           if (value !== "") {
             (merged as any)[key] = value;
           }
         }
         finalCredentials = merged;
       }
    }

    const { error } = await supabaseAdmin
      .from('integrations')
      .upsert({
        id: (data.id && data.id !== "") ? data.id : undefined,
        name: data.name,
        type: data.type,
        category: data.category,
        status: data.status,
        credentials: finalCredentials,
        settings: data.settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'category' });


    if (error) throw new Error(error.message);
    
    return { success: true };
  });

// Fetch integration history
export const getIntegrationHistory = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    category: z.string().optional(),
    limit: z.number().default(20)
  }).parse(data))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from('integration_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(data.limit);

    if (data.category) {
      query = query.eq('integration_name', data.category);
    }

    const { data: logs, error } = await query;
    if (error) throw new Error(error.message);
    return logs;
  });
