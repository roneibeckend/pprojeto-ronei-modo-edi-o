# Plano de Correção: Erro de Ambiente na API do Asaas

O usuário está enfrentando o erro "A chave de API informada não pertence a este ambiente" ao tentar realizar compras, apesar de usar uma chave de produção e o `test_mode` estar configurado como `false`. 

A investigação revelou que o código atual em `src/lib/asaas.functions.ts` possui uma inconsistência na detecção do ambiente:
1. Ele busca a integração onde `category = 'asaas'` e `status = true`.
2. Ele tenta ler `settings.environment` para decidir entre `ASAAS_PRODUCTION_URL` e `ASAAS_SANDBOX_URL`.
3. No entanto, o banco de dados armazena a preferência de ambiente como `testMode` (booleano) em vez de uma string `environment`.

## Ações Propostas

### 1. Ajuste na Lógica de Seleção de Ambiente
Atualizar `src/lib/asaas.functions.ts` para interpretar corretamente o campo `testMode` vindo do banco de dados. Se `testMode` for explicitamente `false`, a URL de produção será utilizada.

### 2. Sincronização de Chaves de Webhook
Garantir que o webhook em `src/routes/api/public/webhooks/asaas.ts` utilize a mesma lógica de validação de token, priorizando o `webhookToken` se configurado, ou a `apiKey` como fallback, respeitando o ambiente ativo.

### 3. Validação do Payload de Requisição
Assegurar que ao criar o link de pagamento, parâmetros que possam forçar o modo de teste (se existirem na API do Asaas para esse endpoint específico) sejam omitidos ou setados corretamente.

## Detalhes Técnicos

- **Arquivo:** `src/lib/asaas.functions.ts`
  - Alterar `const environment = settings.environment || 'sandbox';` para uma lógica que verifique `settings.testMode`.
  - Exemplo: `const isTest = settings.testMode === true || settings.testMode === 'true';`
  - `const baseUrl = isTest ? ASAAS_SANDBOX_URL : ASAAS_PRODUCTION_URL;`

- **Verificação de Cache:**
  - Como o `createServerFn` roda no servidor, vamos garantir que a leitura do banco de dados não esteja sendo afetada por cache agressivo (embora o Supabase Client geralmente busque dados frescos).

- **Logs Adicionais:**
  - Adicionar logs temporários (em modo debug) no servidor para capturar qual URL base e qual prefixo de chave de API estão sendo de fato utilizados no momento da falha.

Este ajuste garantirá que a aplicação aponte para os endpoints de produção do Asaas quando o usuário desativar o modo de teste no painel administrativo.
