# Plano de Gerenciamento de Modelos de E-mail

Centralizar a gestão de e-mails transacionais (boas-vindas, recuperação de senha, confirmação de pagamento) através de uma interface administrativa robusta que permite a criação, edição e categorização de templates.

## Ações Realizadas
- Verificada a infraestrutura existente em `src/lib/resend.server.ts` e `src/lib/email-templates.functions.ts`.
- Analisada a interface atual em `src/routes/admin.integracoes.tsx`.
- Validado o uso de templates no webhook do Asaas (`src/routes/api/public/webhooks/asaas.ts`).

## Próximos Passos
1. **Refinar a Interface de Edição**:
   - Adicionar campo para definir o "tipo de uso" (slug/nome único) de forma clara.
   - Implementar uma lista de variáveis sugeridas baseada no tipo de uso selecionado.
2. **Sistema de Categorização**:
   - Adicionar uma coluna de `category` ou `usage_type` na tabela `email_templates` (se necessário, ou usar o `name` como identificador de evento).
3. **Melhorar a Visualização de Conteúdo Dinâmico**:
   - Adicionar um "Cheat Sheet" lateral no editor com as variáveis disponíveis (ex: `{{name}}`, `{{product_name}}`).
4. **Associação de Eventos**:
   - Garantir que novos templates possam ser facilmente associados a eventos do sistema (como novos cadastros).

## Detalhes Técnicos
- **Banco de Dados**: Tabela `email_templates` já existente com suporte a `variables` (JSONB).
- **Server Functions**: `saveEmailTemplate` e `getEmailTemplates` operacionais.
- **Integração**: Utilização de `triggerEmailEvent` para disparos automatizados.
