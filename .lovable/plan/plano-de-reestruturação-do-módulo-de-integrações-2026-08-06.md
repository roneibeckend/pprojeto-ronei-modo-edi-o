# Plano de Reestruturação do Módulo de Integrações

Modernização do sistema de integração para um Hub centralizado, modular e escalável.

## 1. Banco de Dados (Supabase Migration)
Criar a tabela `public.integrations` para armazenar as configurações de forma flexível.

```sql
CREATE TYPE public.integration_type AS ENUM ('ia', 'payment');

CREATE TABLE public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type public.integration_type NOT NULL,
    category TEXT NOT NULL, -- ex: 'openai', 'mercadopago'
    status BOOLEAN DEFAULT false,
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb, -- Criptografado no servidor
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS e Permissões
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

CREATE POLICY "Admins can manage integrations"
ON public.integrations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

## 2. Arquitetura Modular (`src/lib/integrations/`)
Implementar o padrão **Strategy/Factory** para os provedores.

- `src/lib/integrations/factory.ts`: Instancia o provedor correto baseado no tipo/categoria.
- `src/lib/integrations/ai/`: Classes base e específicas para OpenAI, Gemini, etc.
- `src/lib/integrations/payments/`: Classes base e específicas para Mercado Pago, Stripe, etc.

## 3. Novas Rotas e Interface
- **Rota**: `/app/admin/integracoes` (Adicionada ao menu lateral e layout admin).
- **Componentes UI**:
    - `IntegrationCard`: Bloco visual com status, ícone e botão de gerenciar.
    - `IAConfiguration`: Formulário dinâmico para provedores de IA.
    - `PaymentConfiguration`: Formulário dinâmico para gateways.
    - `ConnectionTester`: Componente reutilizável para o botão "Testar Conexão".

## 4. Segurança e Backend (Server Functions)
- `testIntegrationConnection`: Server function que recebe credenciais (temporárias ou salvas) e executa o ping na API externa.
- `saveIntegration`: Server function que valida e salva (criptografa via `supabaseAdmin` no handler).

## 5. Migração Mercado Pago
- Mapear as configurações atuais do Mercado Pago para o novo esquema.
- Garantir que o checkout existente consulte a nova tabela `integrations`.

## Próximos Passos (Após Aprovação)
1. Executar a migração SQL.
2. Criar a estrutura de pastas e interfaces base.
3. Migrar os dados do Mercado Pago.
4. Implementar o teste de conexão para o primeiro provedor de IA (OpenAI ou Gemini).
