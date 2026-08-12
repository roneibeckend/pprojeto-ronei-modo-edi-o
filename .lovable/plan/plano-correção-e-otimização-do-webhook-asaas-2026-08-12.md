# Plano: Correção e Otimização do Webhook Asaas

O objetivo é resolver o erro "webhook interrompido" no Asaas, garantindo que o endpoint `/api/public/webhooks/asaas` esteja funcional, seguro e devidamente configurado para processar notificações de pagamento.

## Ações Propostas

### 1. Verificação e Ajuste do Endpoint
- O endpoint já existe em `src/routes/api/public/webhooks/asaas.ts`.
- Vou garantir que ele retorne `200 OK` rapidamente para o Asaas para evitar timeouts que causam o status "interrompido".
- Adicionar logs mais detalhados para facilitar o debug de payloads recebidos.

### 2. Melhoria da Lógica de Segurança
- Confirmar se a validação do `asaas-access-token` está alinhada com as configurações do painel do Asaas.
- Caso o token não esteja configurado no banco, o webhook falhará com 401. Instruirei o usuário sobre onde configurar isso.

### 3. Tratamento de Erros e Robustez
- Melhorar o bloco `try/catch` para capturar falhas específicas de banco de dados (Supabase) sem interromper a resposta de sucesso para o Asaas (para evitar retentativas infinitas em erros de lógica).
- Validar se a estrutura do `externalReference` está sendo processada corretamente para todos os tipos de produtos (Cursos e futuramente E-books).

### 4. Instruções para o Usuário
- Fornecer a URL exata a ser configurada no Asaas: `https://[seu-dominio]/api/public/webhooks/asaas`.
- Explicar a necessidade de configurar o "Fila de Sincronização" no Asaas para garantir a entrega.

## Detalhes Técnicos
- **Arquivo:** `src/routes/api/public/webhooks/asaas.ts`
- **Segurança:** Validação via header `asaas-access-token`.
- **Banco de Dados:** Uso de `supabaseAdmin` para bypassar RLS em ações do sistema (matrícula automática).
- **Payload:** Foco nos eventos `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`.
