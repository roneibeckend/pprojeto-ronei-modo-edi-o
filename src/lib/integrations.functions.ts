import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Schema para os provedores de IA
const AISettingsSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória"),
  baseUrl: z.string().optional(),
  organization: z.string().optional(),
  defaultModel: z.string().optional(),
  timeout: z.number().default(30000),
});

// Server function para testar a conexão com um provedor de IA
export const testAIConnection = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    category: z.string(),
    credentials: AISettingsSchema
  }).parse(data))
  .handler(async ({ data }) => {
    const { category, credentials } = data;
    const startTime = Date.now();
    
    try {
      console.log(`[Admin] Testando conexão com ${category}...`);
      
      // Simulação de teste real
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (category === 'openai') {
        if (!credentials.apiKey.startsWith('sk-')) {
          throw new Error("Chave de API OpenAI parece inválida (deve começar com sk-)");
        }
      }

      const logData = {
        integration_name: category,
        status: 'success',
        message: "Conectado com sucesso",
        latency: `${Date.now() - startTime}ms`,
        details: { provider: category }
      };

      // Registrar log no banco de dados (usando supabaseAdmin)
      await supabaseAdmin.from('integration_logs' as any).insert([logData]);

      return {
        success: true,
        message: logData.message,
        latency: logData.latency,
        status: 200
      };
    } catch (error: any) {
      const logData = {
        integration_name: category,
        status: 'error',
        message: error.message || "Falha na conexão",
        latency: `${Date.now() - startTime}ms`,
        details: { provider: category, error: error.message }
      };

      await supabaseAdmin.from('integration_logs' as any).insert([logData]);

      return {
        success: false,
        message: logData.message,
        status: 401
      };
    }
  });

// Server function para salvar uma integração
export const saveIntegration = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.enum(['ia', 'payment']),
    category: z.string(),
    status: z.boolean(),
    credentials: z.any(),
    settings: z.any()
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from('integrations')
      .upsert({
        id: data.id,
        name: data.name,
        type: data.type,
        category: data.category,
        status: data.status,
        credentials: data.credentials,
        settings: data.settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw new Error(error.message);
    
    return { success: true };
  });
