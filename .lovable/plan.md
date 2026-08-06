# Plano de Aprimoramento do Módulo de Integrações

Este plano detalha a reestruturação do Hub de Integrações para torná-lo uma ferramenta robusta, funcional e educativa para o administrador.

## 1. Reestruturação do Componente de Integrações (`src/routes/admin.integracoes.tsx`)
- **Novas Seções no Modal:** Adição de uma área lateral ou seção expansível de "Guia de Ativação" dentro do modal de configuração.
- **Instruções Dinâmicas:** Exibição de guias passo a passo baseados na `category` da integração (ex: OpenAI, Asaas, Stripe).
- **URLs de Webhook Automáticas:** Geração automática e exibição da URL de Webhook que o usuário deve colar no provedor (ex: `https://[dominio]/api/public/webhooks/asaas`).

## 2. Conteúdo dos Guias de Ativação
### Pagamentos (Asaas)
- **Passo 1:** Criar conta no Asaas (Sandbox ou Produção).
- **Passo 2:** Gerar API Key em Configurações > Integrações.
- **Passo 3:** Configurar Webhook no Asaas apontando para a URL fornecida, selecionando os eventos de "Pagamento Confirmado" e "Pagamento Vencido".
### IA (OpenAI / Anthropic)
- **Passo 1:** Acessar o dashboard da plataforma (ex: platform.openai.com).
- **Passo 2:** Criar uma nova API Key com as permissões necessárias.
- **Passo 3:** Verificar saldo/créditos na conta.

## 3. Melhorias na Validação e Testes (`src/lib/integrations.functions.ts`)
- **Testes Reais:** Substituir mocks por chamadas reais de teste (ex: `listModels` para OpenAI) para verificar se a chave é funcional.
- **Validação de Webhook:** Implementar um endpoint de "Ping" para que o usuário possa testar se o webhook do Asaas está alcançando a plataforma.

## 4. Endpoints de Webhook (`src/routes/api/public/webhooks/asaas.ts`)
- Criação do esqueleto do receptor de webhook para processar notificações reais de pagamento, integrando com o banco de dados de inscrições (`enrollments`).

## 5. UI/UX
- Adição de indicadores de "Passo a Passo" concluído.
- Tooltips explicativas para termos técnicos como "API Key", "Base URL" e "Webhook".
