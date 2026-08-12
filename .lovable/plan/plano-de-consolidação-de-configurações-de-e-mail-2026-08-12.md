# Plano de Consolidação de Configurações de E-mail

Centralização das configurações da API Key do Resend e parâmetros de remetente na seção "Integrações > Email" do painel administrativo.

## Mudanças

### Backend e Dados
- Nenhuma alteração de esquema é necessária, pois as tabelas `integrations` e `email_settings` já existem.
- O backend (`src/lib/resend.server.ts`) já está configurado para ler a API Key da tabela `integrations` (categoria `resend`).

### Frontend (Admin)
- **src/routes/admin.integracoes.tsx**:
    - Adicionar um novo `TabsTrigger` ("API Key") dentro de `EmailIntegrationPanel`.
    - Criar um novo `TabsContent` para gerenciar a `Integration` do Resend (API Key e Status) dentro do painel de E-mail.
    - Utilizar as server functions `saveIntegration` e `testIntegrationConnection` para gerenciar a chave do Resend diretamente na aba de E-mail.
    - Remover alertas que sugerem configurar a chave em outro local, já que agora ela estará centralizada.
    - Garantir que a aba superior "E-mail" selecione a categoria correta e limpe estados de seleção de outras categorias para evitar confusão.

## Detalhes Técnicos
- A aba "Integrações > Email" agora gerenciará dois registros distintos:
    1. A entrada na tabela `integrations` (categoria `resend`) para a `apiKey`.
    2. A entrada na tabela `email_settings` para metadados de envio (`from_name`, `from_email`, etc.).
- O componente `EmailIntegrationPanel` será refatorado para buscar e salvar ambos os dados de forma transparente.

## Verificação
- Validar se a API Key salva na aba "Email" é persistida corretamente na tabela `integrations`.
- Testar o envio de e-mail de teste para confirmar que o sistema utiliza a chave configurada no novo local.
- Verificar se os logs de auditoria continuam funcionando após a consolidação.
