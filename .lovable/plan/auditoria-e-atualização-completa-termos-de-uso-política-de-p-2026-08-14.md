# Auditoria e Atualização Completa - Termos de Uso, Política de Privacidade e Compliance

Este plano detalha a revisão e reconstrução profissional dos documentos jurídicos da plataforma "Espetinho na Veia", adaptados à operação real identificada na auditoria técnica.

## 1. Auditoria e Inventário Técnico (Concluído)
- **Dados Coletados:** Identificados em `profiles` (nome, email, whatsapp, progresso) e `leads` (captura na landing page).
- **Integrações:** Mapeadas: Supabase (Cloud/Auth/DB/Storage), Asaas (Pagamentos), Resend (E-mails), Meta Pixel (Marketing), Google/YouTube (Vídeos).
- **Cookies/Rastreamento:** Identificados cookies de sessão (Supabase), preferências (LMS/Admin) e marketing (Meta/Contagem regressiva).
- **IA:** Identificado suporte para integração com provedores de IA no painel administrativo.
- **Fluxo Financeiro:** Processamento via Asaas, com garantia de 7 dias e sem armazenamento de cartões na plataforma.

## 2. Reconstrução dos Documentos

### Termos de Uso (`src/routes/termos-de-uso.tsx`)
- Título: **TERMOS DE USO**
- Subtítulo: **Regras para utilização da plataforma**
- Inclusão de versão e data de atualização.
- Seções: Objeto, Acesso e Cadastro, Obrigações do Usuário, Pagamentos e Reembolso (CDC), Propriedade Intelectual (Conteúdo do Curso/Ebook), Programa de Afiliados, Limitação de Responsabilidade ("nos limites da lei") e Foro.

### Política de Privacidade (`src/routes/politica-de-privacidade.tsx`)
- Estrutura clara baseada na LGPD.
- Detalhamento dos dados coletados por categoria (Conta, Uso, Financeiro).
- Lista explícita de compartilhamento com terceiros (Asaas, Resend, Meta).
- Direitos dos titulares (acesso, exclusão, correção).
- Base legal para cada tratamento.
- **Política de Cookies Integrada:** Tabela com nome, finalidade, fornecedor e duração.

## 3. Implementações de Interface

### Banner de Cookies e Consentimento
- Revisar o fluxo de consentimento para garantir que não haja checkboxes pré-marcados para marketing.
- Garantir que links para os novos documentos estejam visíveis no rodapé.

## 4. Dados Pendentes (Informações de Empresa)
Os seguintes campos serão marcados como `[PREENCHER ANTES DA PUBLICAÇÃO]` para que o proprietário insira os dados reais:
- Razão Social e CNPJ.
- Endereço da sede.
- E-mail jurídico e DPO (Encarregado).

## Detalhes Técnicos
- Uso de componentes Shadcn/UI para manter a estética premium.
- Respeito à responsividade mobile.
- Utilização de `createServerFn` para qualquer lógica de servidor necessária.
- Garantia de que as rotas jurídico-legais (`/termos-de-uso`, `/politica-de-privacidade`) sejam acessíveis publicamente.
