# Plano de Implementação: Sistema de Notificações Push

Este plano detalha a criação de um sistema de notificações para administradores notificarem alunos sobre atualizações.

## Alterações no Banco de Dados
- Criação da tabela `public.notifications` para armazenar o histórico de mensagens enviadas.
- Criação da tabela `public.user_notifications` para rastrear leitura (opcional para o futuro).
- Políticas de RLS para permitir que apenas administradores enviem e todos visualizem.

## Funcionalidades Administrativas
- Nova rota `/admin/notificacoes` com formulário de envio.
- Tipos de notificação: Novidade geral, Novo curso, Nova aula, Aula ao vivo.
- Integração visual para envio imediato.

## Funcionalidades para Alunos
- Componente de "Sininho" de notificações no `Shell.tsx`.
- Toast ou modal para novas notificações recebidas.

## Passos de Execução
1. Executar migração SQL.
2. Criar rota administrativa `src/routes/admin.notificacoes.tsx`.
3. Adicionar item no menu lateral do admin em `src/routes/admin.tsx`.
4. Criar hook `use-notifications.ts` para gerenciar o estado no frontend.
5. Integrar visualização no `Shell.tsx` dos alunos.
