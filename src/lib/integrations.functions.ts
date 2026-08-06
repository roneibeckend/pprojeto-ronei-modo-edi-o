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
  .input(z.object({
    category: z.string(),
    credentials: AISettingsSchema
  }))
  .handler(async ({ data }) => {
    const { category, credentials } = data;
    
    // Simulação de chamada real baseada no provedor
    // No futuro, aqui teremos a lógica real de fetch para cada API
    try {
      console.log(`[Admin] Testando conexão com ${category}...`);
      
      // Delay simulado
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (category === 'openai') {
        // Exemplo: fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${credentials.apiKey}` } })
        if (!credentials.apiKey.startsWith('sk-')) {
          throw new Error("Chave de API OpenAI parece inválida (deve começar com sk-)");
        }
      }

      return {
        success: true,
        message: "Conectado com sucesso",
        latency: "142ms",
        status: 200
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Falha na conexão",
        status: 401
      };
    }
  });

// Server function para salvar uma integração
export const saveIntegration = createServerFn({ method: "POST" })
  .input(z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.enum(['ia', 'payment']),
    category: z.string(),
    status: z.boolean(),
    credentials: z.any(),
    settings: z.any()
  }))
  .handler(async ({ data }) => {
    // Usando supabaseAdmin para bypass de RLS se necessário, ou contexto.supabase se preferir RLS do admin
    const { error } = await supabaseAdmin
      .from('integrations')
      .upsert({
        id: data.id,
        name: data.name,
        type: data.type,
        category: data.category,
        status: data.status,
        credentials: data.credentials, // Em produção, criptografar aqui
        settings: data.settings
      });

    if (error) throw new Error(error.message);
    
    return { success: true };
  });
