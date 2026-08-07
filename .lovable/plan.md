# Plano de Implementação: Funcionalidade de Saque para Sócios

Este plano descreve as etapas para adicionar a funcionalidade de saque para sócios, permitindo que eles retirem sua participação nos lucros.

## 1. Banco de Dados
*   Criar tabela `partner_balances` para rastrear o saldo disponível de cada sócio (vinculado ao `user_id`).
*   Configurar RLS para permitir que sócios vejam seu saldo e administradores gerenciem tudo.
*   Reutilizar a tabela `payout_requests` existente para as solicitações de saque, garantindo compatibilidade.

## 2. Lógica de Negócio
*   Atualizar `src/lib/payouts.functions.ts` para suportar saques de sócios.
*   Implementar a lógica que permite ao administrador "liberar" lucros para os sócios com base na divisão configurada no painel financeiro.

## 3. Interface do Usuário
*   **Menu Lateral**: Adicionar "Meu Financeiro" para usuários com perfil de sócio (`manager`/`admin`).
*   **Nova Rota `/app/financeiro`**: Página dedicada para o sócio visualizar seu saldo acumulado, histórico e solicitar saques via PIX.
*   **Painel Admin**: Adicionar botão no painel financeiro para "Processar Distribuição de Lucros", que converte o lucro simulado em saldo real para os sócios.

## 4. Segurança
*   Garantir que apenas usuários autorizados acessem as funcionalidades de saque.
