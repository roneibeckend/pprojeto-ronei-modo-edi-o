# Plano de Correção: Mensagens de Suporte e Acesso a Chamados

Este plano visa corrigir o problema de mensagens em branco, falha na entrega de atualizações e impossibilidade de visualizar chamados.

## 1. Padronização do Banco de Dados
- Atualizar os status existentes de 'Aberto' para 'open' para seguir o padrão de chaves do sistema.
- Garantir que todas as tabelas e políticas de RLS estejam alinhadas com o uso da tabela `profiles`.

## 2. Área do Aluno (`/app/suporte`)
- **Visualização de Detalhes**: Implementar uma interface para que o aluno possa clicar em um chamado e ver todo o histórico de mensagens (conversa entre aluno e suporte).
- **Consumo de Mensagens Real**: Buscar as mensagens da tabela `support_messages` vinculadas ao ticket.
- **Feedback Visual**: Melhorar os estados de carregamento e as notificações de novas mensagens.

## 3. Área Administrativa (`/admin/suporte`)
- **Correção de Exibição**: Alterar a visualização para buscar a primeira mensagem do chamado na tabela `support_messages` (já que a coluna `message` não existe em `support_tickets`).
- **Histórico Completo**: Mostrar todo o histórico de mensagens na janela de detalhes do ticket.
- **Resposta Real**: Garantir que o envio de mensagens insira corretamente na tabela `support_messages` e atualize o status do ticket.

## 4. Validação
- Verificar se um aluno consegue abrir um chamado e ver sua própria mensagem.
- Verificar se o admin consegue ver o chamado, a mensagem e responder.
- Verificar se o aluno recebe a resposta no histórico do chamado.
