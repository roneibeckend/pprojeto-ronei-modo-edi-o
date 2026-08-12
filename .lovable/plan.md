# Plano: Gerenciamento Avançado de E-mails

Este plano detalha a implementação de um editor de templates de e-mail, histórico detalhado de disparos e validação automática de remetente usando a integração com Resend.

## Alterações Sugeridas

### Backend (Banco de Dados e Funções)
- **Migração SQL**: 
    - Criar tabela `email_templates` para armazenar os modelos de e-mail customizáveis.
    - Adicionar colunas de validação na tabela `email_settings` (`validation_status`, `last_validation_at`, `validation_error`).
    - Garantir permissões RLS e Grants para administradores.
- **Server Functions**:
    - `src/lib/email-templates.functions.ts`: Implementar CRUD para templates (GET, SAVE, DELETE).
    - `src/lib/resend.functions.ts`: Atualizar para incluir a lógica de validação automática de remetente após o salvamento das configurações.
    - `src/lib/resend.server.ts`: Adicionar helper para verificar status do domínio/remetente na API do Resend.

### Frontend (Interface Administrativa)
- **Editor de Templates**:
    - Criar aba "Templates" em `admin.integracoes.tsx`.
    - Interface para criar/editar templates com pré-visualização HTML básica.
    - Funcionalidade de "Enviar Teste" vinculada ao template selecionado.
- **Histórico de Disparos**:
    - Melhorar a aba "Logs" existente para mostrar detalhes do destinatário (com máscara parcial) e status real vindo do provedor.
- **Validação Automática**:
    - Implementar um `useEffect` ou trigger no botão "Salvar" que dispara a verificação de identidade no Resend imediatamente.
    - Exibir badges de status (Validado, Pendente, Erro) na interface.

## Detalhes Técnicos
- O editor de templates usará uma área de texto simples para HTML (podendo ser expandido para um editor rico no futuro).
- A validação usará o endpoint `/domains` da Resend para verificar se o domínio do e-mail do remetente está verificado.
- Os templates suportarão variáveis dinâmicas usando sintaxe `{{variable}}`.

## Próximos Passos
1. Executar as migrações de banco de dados.
2. Criar os arquivos de tipos e funções de servidor.
3. Atualizar o componente `IntegrationsPage` para incluir as novas abas e lógica.
