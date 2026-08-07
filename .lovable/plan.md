# Plano de Migração: WhatsApp para E-mail (Resend)

Este plano descreve a migração do sistema de notificações via WhatsApp para e-mail transacional utilizando o Resend.com.

## 1. Configuração e Infraestrutura
- [ ] Criar `src/lib/resend.functions.ts` para centralizar a lógica de envio via Resend API.
- [ ] Adicionar segredos via `add_secret`: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`.
- [ ] Atualizar o esquema do banco de dados (tabela `report_recipients`) para incluir o campo `email` se não existir.

## 2. Integração com Resend
- [ ] Implementar a função `sendEmail` no servidor usando `fetch` para a API do Resend.
- [ ] Criar templates básicos de e-mail (HTML) para os relatórios financeiros.

## 3. Substituição das Notificações
- [ ] **Relatórios Diários**: Modificar `src/routes/api/public/daily-financial-report.ts` para chamar `sendEmail` em vez de `sendWhatsApp`.
- [ ] **Painel Administrativo**: Atualizar `src/routes/admin.relatorios.tsx` para refletir a mudança (mudar ícones de WhatsApp para E-mail, atualizar labels e modais).

## 4. Limpeza e Refatoração
- [ ] Remover ou marcar como legados os arquivos `src/lib/whatsapp.functions.ts` e rotas relacionadas.
- [ ] Atualizar logs de envio para suportar contextos de e-mail.

## 5. Validação
- [ ] Testar envio de e-mail de teste pelo Painel Admin.
- [ ] Validar o recebimento dos e-mails com a formatação correta.
