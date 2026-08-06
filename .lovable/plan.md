# Plano de Implementação: Gestão Administrativa de Chamados de Suporte

Este plano descreve as etapas para permitir que a gestão administrativa visualize, receba e gerencie chamados de suporte originados pelos membros da plataforma.

## 1. Persistência de Dados (Membros)
Atualmente, a página de suporte do membro (`/app/suporte`) utiliza dados simulados (mock).
- Refatorar `src/routes/app.suporte.tsx` para buscar chamados reais da tabela `support_tickets`.
- Implementar a criação de chamados reais enviando dados para `support_tickets` e a mensagem inicial para `support_messages`.

## 2. Interface Administrativa
Criar uma nova rota administrativa dedicada ao suporte.
- **Arquivo:** `src/routes/admin.suporte.tsx`
- **Funcionalidades:**
    - Listagem de todos os chamados da plataforma (Filtros: Todos, Pendentes, Respondidos, Fechados).
    - Exibição de informações do membro (Nome, E-mail, Data de abertura).
    - Interface de chat para visualizar o histórico de mensagens e enviar respostas ao membro.
    - Alteração de status do chamado (ex: marcar como "Em análise" ou "Fechado").

## 3. Navegação e Notificações
- Adicionar o link "Suporte" no menu lateral do painel administrativo (`src/routes/admin.tsx`).
- Adicionar um card de estatística no dashboard principal (`src/routes/admin.index.tsx`) exibindo o número de chamados pendentes para ação rápida.

## 4. Segurança e Permissões
- As políticas de RLS e concessões de acesso (GRANTs) já foram configuradas para garantir que:
    - Membros vejam apenas seus próprios chamados.
    - Administradores tenham acesso total a todos os chamados e mensagens da plataforma.

---
**Resultado Esperado:** O administrador poderá responder chamados em tempo real, e o membro verá as atualizações instantaneamente em sua área logada.
