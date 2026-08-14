# Auditoria Técnica da Plataforma

Este documento apresenta o inventário técnico da plataforma para subsidiar a atualização dos Termos de Uso e Política de Privacidade.

## 1. Dados Coletados

### Dados de Conta (Tabela `profiles`)
- `id` (UUID): Identificador único.
- `name` (Texto): Nome completo do usuário.
- `email` (Texto): Endereço de e-mail (autenticação e comunicação).
- `phone` (Texto): Número de WhatsApp para suporte e notificações.
- `avatar_url` (Texto): Foto de perfil (opcional).
- `status` (Texto): Status da conta (ex: lead, aluno).
- `email_notifications_opt_in` (Booleano): Preferência de marketing por e-mail.

### Dados de Leads (Tabela `leads`)
- Coletados via formulário de captura (landing page).
- `name`, `email` (sintético), `phone`, `source`.

### Dados de Uso
- IP, Navegador, Dispositivo: Coletados via logs do servidor (Supabase/Lovable) e scripts de analytics (Meta Pixel).
- Eventos de Pixel: `PageView`, `Lead`, `InitiateCheckout`.

## 2. Conteúdo do Usuário
- Avaliações e feedbacks de cursos/ebooks.
- Progresso em aulas e capítulos.
- Mensagens enviadas ao suporte via chat/tickets.
- Documentos e arquivos enviados para o sistema de materiais (por administradores).

## 3. Integrações e Terceiros

| Fornecedor | Finalidade | Dados Enviados |
| :--- | :--- | :--- |
| **Supabase (Lovable Cloud)** | Banco de dados, Auth e Storage | Todos os dados da conta, arquivos e logs. |
| **Asaas** | Processamento de pagamentos | Nome, E-mail, CPF/CNPJ, Telefone, Dados de cartão (direto no gateway). |
| **Resend** | Envio de e-mails transacionais e marketing | Nome, E-mail, Conteúdo da mensagem. |
| **Meta (Facebook Pixel)** | Analytics e Publicidade | Eventos de navegação, E-mail (hasheado), Valor da conversão. |
| **Google Drive / YouTube** | Hospedagem de vídeos | IDs de vídeo (incorporação). |

## 4. Cookies e Tecnologias de Rastreamento

### Necessários
- `sb-jpapgdwrjjvhmniqtukg-auth-token`: Token de sessão do Supabase (autenticação).
- Session storage para estado temporário da UI.

### Preferências
- `finance-period`, `finance-custom-start`, `finance-custom-end`: Filtros do dashboard administrativo.
- `course_opening_*`, `ebook_opening_*`: Controle de primeira visualização.
- `course_last_watched_*`, `ebook_last_read_*`: Retomada de progresso.

### Analytics / Marketing
- Meta Pixel (`_fbp`, `_fbc`).
- `env_offer_deadline_*`: Controle de contagem regressiva de oferta.
- `espetinho_lead_sent`: Controle de exibição do popup de captura.
- `affiliate_referrer_code`: Rastreamento de afiliados.

## 5. Fluxo Financeiro e Operacional
- Pagamentos processados pelo Asaas.
- A plataforma armazena `asaas_payment_id` e status da transação.
- **Não** armazenamos dados sensíveis de cartão de crédito.
- O cancelamento e reembolso (garantia de 7 dias) são processados via suporte (e-mail/WhatsApp).

## 6. Inteligência Artificial
- Integrações configuradas para modelos de IA (OpenAI, Gemini, etc.) no cockpit administrativo para suporte e automação.
- Os dados enviados dependem da interação no chat de suporte.

---
**Informações Pendentes [PREENCHER ANTES DA PUBLICAÇÃO]:**
- Razão Social e CNPJ da empresa.
- Endereço físico da sede.
- E-mail jurídico oficial (atualmente contato@espetinhonaveia.com).
- Nome do Encarregado de Dados (DPO).
- Detalhes específicos de retenção de dados (prazos legais).
