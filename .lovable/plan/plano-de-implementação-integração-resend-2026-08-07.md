# Plano de Implementação: Integração Resend

Este plano detalha a implementação do sistema de e-mails transacionais utilizando Resend e Supabase Edge Functions.

## 1. Auditoria e Mapeamento
- **Pontos de envio identificados:**
  - Cadastro/Login (Auth) -> Gerenciado via Supabase Auth + SMTP Resend.
  - Liberação de Produto (Webhook Asaas) -> Novo gatilho para `acesso_liberado_produto`.
  - Suporte (Ticket Admin) -> Novo gatilho para `suporte_recebido` e `resposta_suporte`.
  - Conclusão de Curso/Certificado -> Gatilho no componente de Certificados.
  - Relatórios Financeiros -> Migrar de WhatsApp para e-mail.
- **Status:** Nenhuma funcionalidade de e-mail transacional ativa além do padrão do Supabase.

## 2. Configuração de Banco de Dados (Aditiva)
- Tabela `email_settings`: Configurações de remetente e toggles.
- Tabela `email_logs`: Auditoria completa e controle de idempotência.
- Tabela `email_templates_config`: Armazenamento de assuntos e metadados de templates.
- Atualização em `profiles`: Adição de campo `email_notifications_opt_in`.

## 3. Infraestrutura Supabase
- **Edge Function `send-email`**:
  - Runtime: Deno.
  - SDK: `resend`.
  - Segurança: Validação de JWT e verificação de `admin_role` via RPC `has_role`.
  - Lógica: Idempotência via `email_logs` e retry com backoff.
- **SMTP Supabase Auth**: Configurar `smtp.resend.com` nas definições do projeto.

## 4. Templates de E-mail (React Email)
- Layout base premium (claro).
- Templates:
  - `boas_vindas`
  - `acesso_liberado_produto`
  - `conclusao_curso`
  - `certificado_emitido`
  - `novo_conteudo`
  - `suporte_recebido`

## 5. Painel Administrativo
- Integração no Hub: Novo card "Resend" em `/admin/integracoes`.
- Gestão de Logs: Nova aba em `/admin/integracoes` ou seção dedicada.
- Testes: Interface para envio de e-mails de teste.

## 6. Próximos Passos (Ação)
1. Executar migrations de banco de dados.
2. Criar a Edge Function `send-email`.
3. Desenvolver os templates e a biblioteca `resend.functions.ts`.
4. Atualizar a interface administrativa.
5. Configurar o SMTP do Supabase Auth.
