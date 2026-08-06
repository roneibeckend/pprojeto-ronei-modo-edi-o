# Plano de Implementação: Migração de WhatsApp para Asaas

Este plano descreve a substituição do método de compra via WhatsApp pela integração direta com a plataforma Asaas em todo o ecossistema da aplicação.

## 1. Infraestrutura e Funções de Servidor
- Criar `src/lib/asaas.functions.ts` para gerenciar a criação de links de pagamento (Payment Links) via API do Asaas.
- A função buscará as credenciais ativas da tabela `integrations` (categoria 'asaas').
- Implementar tratamento de erro caso o Asaas não esteja configurado ou ativo.

## 2. Interface do Aluno (Frontend)
- **Detalhes do Curso (`src/routes/app.cursos.$courseId.tsx`)**:
  - Remover o link `wa.me`.
  - Adicionar um estado de carregamento durante a geração do link do Asaas.
  - Implementar uma função que chama o servidor para obter o link de pagamento e redirecionar o usuário.
- **Detalhes do E-book (`src/routes/app.ebooks.$ebookId.tsx`)**:
  - Aplicar a mesma lógica de substituição do WhatsApp pelo fluxo Asaas.
- **Showcase e Listagens (`app.index.tsx`, `app.cursos.index.tsx`, `app.ebooks.index.tsx`)**:
  - Manter o redirecionamento para a página de detalhes (comportamento atual), garantindo que a página de destino gerencie o novo fluxo de pagamento.

## 3. Webhooks e Liberação Automática
- Revisar `src/routes/api/public/webhooks/asaas.ts` para garantir que, ao receber a notificação de pagamento aprovado (`PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`), o sistema:
  - Identifique o curso/ebook via `externalReference` ou metadados.
  - Insira o registro nas tabelas `course_enrollments` ou `ebook_enrollments`.

## 4. Validação
- Testar a geração do link com credenciais em modo sandbox.
- Verificar se o botão de compra exibe feedback visual enquanto processa a requisição.
