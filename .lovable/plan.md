# Plano: Adição de Cabeçalho User-Agent nas Requisições do Asaas

O Asaas agora exige o cabeçalho `User-Agent` em todas as requisições HTTP. Este plano descreve a atualização da integração para incluir esse cabeçalho, garantindo que o processo de compra funcione sem interrupções.

## Alterações Propostas

### Backend (Integração Asaas)

#### Adicionar User-Agent em `src/lib/asaas.functions.ts`
- Modificar a função `createAsaasPaymentLink` para incluir o cabeçalho `User-Agent` no objeto `headers` da chamada `fetch`.
- Valor sugerido: `Lovable-LMS-Platform/1.0.0 (+https://lovable.app)`.

#### Adicionar User-Agent em `src/lib/integrations.functions.ts`
- Atualizar a função de teste de conexão (`testIntegrationConnection`) para o Asaas, garantindo que o cabeçalho também esteja presente nos testes realizados no painel administrativo.

## Detalhes Técnicos
- As requisições são feitas usando a API nativa `fetch` dentro de `createServerFn` do TanStack Start.
- O cabeçalho `User-Agent` é padrão para identificação da origem da requisição e é obrigatório por alguns firewalls e APIs de pagamento para segurança e monitoramento.

## Validação
- Realizar um teste de conexão via Painel Administrativo > Integrações > Asaas.
- Simular a criação de um link de pagamento na vitrine de cursos.
- Verificar logs do servidor para confirmar a ausência do erro de "User-Agent obrigatório".