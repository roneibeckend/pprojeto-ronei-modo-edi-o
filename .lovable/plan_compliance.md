# Plano de Atualização - Compliance e Documentos Jurídicos

Este plano detalha a reconstrução dos Termos de Uso e Política de Privacidade com base na auditoria técnica realizada.

## Etapa 1: Reconstrução dos Termos de Uso
- **Arquivo:** `src/routes/termos-de-uso.tsx`
- **Foco:** Regras de acesso, propriedade intelectual, garantia de 7 dias (CDC), regras de afiliados e isenção de resultados.
- **Terminologia:** Uso de "nos limites permitidos pela legislação aplicável".

## Etapa 2: Reconstrução da Política de Privacidade
- **Arquivo:** `src/routes/politica-de-privacidade.tsx`
- **Foco:** Transparência total sobre dados coletados (Conta, Leads, Uso), bases legais da LGPD, compartilhamento com Asaas/Resend/Meta e direitos do titular.
- **Seção de Cookies:** Detalhamento de cookies necessários, de preferência e marketing.

## Etapa 3: Implementação da Política de Cookies e Centro de Preferências
- **Ação:** Adicionar seção específica ou página dedicada à Política de Cookies.
- **Mecanismo:** Refinar o banner de cookies (se necessário) para permitir rejeição de não essenciais.

## Etapa 4: Ajustes de Consentimento
- **Ação:** Verificar formulários de captura e checkout para garantir que a aceitação dos Termos e o consentimento de marketing sejam claros e separados.

## Etapa 5: Relatório Final de Lacunas
- **Ação:** Listar dados de `[PREENCHER]` (Razão Social, CNPJ, etc.) para o usuário.
