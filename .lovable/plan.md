# Plano de Correção: Persistência de Dados de Remetente e Ativação de Envio

Este plano aborda os defeitos no módulo de integração de e-mail (Resend), onde as configurações de identidade do remetente não persistem corretamente e o botão de ativação apresenta falhas intermitentes.

## Problemas Identificados

1.  **Dessincronização de Estado (Frontend):** O componente `EmailIntegrationPanel` utiliza `defaultValue` nos inputs para evitar resets durante mutações, mas isso impede que o React acompanhe as mudanças de estado para o botão "Ativar". O botão lê valores diretamente do DOM, o que pode falhar se a referência for perdida ou se o componente re-renderizar.
2.  **Mecanismo de Salvamento Frágil:** A função `updateEmailSettings` tenta auto-validar o remetente no servidor após salvar. Se essa validação falhar (ex: chave de API ausente ou inválida), o processo de salvamento pode não refletir o estado desejado ou causar confusão na UI.
3.  **Lógica do Botão "Ativar":** O botão de ativação depende tanto de dados persistidos no banco quanto de valores em tempo real nos inputs. Se o banco estiver "vazio" e o usuário clicar em ativar sem salvar primeiro, a lógica de "ler do DOM" pode falhar se os IDs dos elementos não estiverem estáveis.

## Ações Propostas

### 1. Refatorar Gerenciamento de Estado no Frontend
*   Mudar de `defaultValue` com leitura direta do DOM para estado controlado via `useState` ou um formulário local robusto no `EmailIntegrationPanel`.
*   Garantir que o estado local seja inicializado corretamente com os dados da query (`email_settings`) e sincronizado apenas quando necessário.
*   Simplificar o botão "Ativar" para que ele execute o salvamento e a ativação em uma única operação atômica quando dados novos estiverem presentes.

### 2. Estabilizar Funções de Servidor
*   Melhorar `updateEmailSettings` em `src/lib/resend.functions.ts` para garantir que a inserção/atualização ocorra antes da tentativa de validação.
*   Garantir que a função `getResendConfig` em `src/lib/resend.server.ts` retorne dados consistentes, evitando erros de "Integração não configurada" quando os dados acabaram de ser salvos.

### 3. Melhorar Feedback Visual
*   Adicionar estados de carregamento claros aos botões de salvamento e ativação.
*   Invalidar as queries do TanStack Query corretamente para forçar a atualização dos componentes após o sucesso.

## Detalhes Técnicos

*   **Arquivos afetados:**
    *   `src/routes/admin.integracoes.tsx`: Refatoração do `EmailIntegrationPanel`.
    *   `src/lib/resend.functions.ts`: Ajuste na lógica de persistência e validação.
    *   `src/lib/resend.server.ts`: Refinamento na prioridade de leitura das chaves de API.
*   **Segurança:** Manter o uso de `requireSupabaseAuth` e verificações de role `admin` em todas as funções de servidor.
