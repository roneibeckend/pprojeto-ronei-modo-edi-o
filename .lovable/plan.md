# Plano de Correção: Erro de Chave Estrangeira em `partner_balances`

Este plano detalha as etapas para corrigir a violação de chave estrangeira ao distribuir lucros para sócios. O problema ocorre porque o sistema tenta usar o ID da tabela `financial_partners` como se fosse um ID de usuário da plataforma.

## Problema Identificado
A função de distribuição de lucros (`distribute_partner_profits`) recebe um `partnerId` e tenta inseri-lo na tabela `partner_balances.user_id`. No entanto, a tabela `financial_partners` possui IDs próprios que não correspondem aos IDs da tabela `auth.users`, causando a falha na restrição de chave estrangeira.

## Etapas de Implementação

### 1. Banco de Dados (Migração)
- Adicionar a coluna `user_id` (UUID) na tabela `public.financial_partners`, referenciando `auth.users(id)`.
- Atualizar a política de RLS para permitir que administradores gerenciem esta nova coluna.
- Vincular o sócio fundador padrão ao usuário administrador existente para fins de teste.

### 2. Interface Administrativa (`src/routes/admin.financeiro.tsx`)
- Atualizar a busca de dados para incluir o campo `user_id` dos sócios.
- Modificar o formulário de sócios para incluir um seletor (ou campo de texto para UUID) que permita vincular o sócio a um usuário real da plataforma.
- Ajustar a função `handleDistribute` para usar `partner.user_id` em vez de `partner.id` ao chamar a função de servidor `distributeProfits`.
- Adicionar uma validação para impedir a distribuição para sócios que não possuem um usuário vinculado.

### 3. Funções de Servidor (`src/lib/payouts.functions.ts`)
- Garantir que a validação do `partnerId` (que agora será o `user_id` real) esteja correta.

## Verificação
- Salvar as novas configurações de sócios vinculando pelo menos um deles a um usuário real.
- Executar a "Distribuição de Lucros" e verificar se o saldo é atualizado na tabela `partner_balances` sem erros.
- Tentar distribuir para um sócio sem usuário vinculado e verificar se o sistema lida com isso graciosamente (ex: ignorando ou avisando).
