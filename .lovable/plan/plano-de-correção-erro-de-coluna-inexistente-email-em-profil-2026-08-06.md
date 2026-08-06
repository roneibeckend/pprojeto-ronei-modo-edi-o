# Plano de Correção: Erro de Coluna Inexistente (email) em Profiles

O objetivo deste plano é corrigir o erro `column profiles_1.email does not exist` que impede o carregamento correto dos chamados de suporte na área administrativa. O erro ocorre porque a tabela `profiles` não possui uma coluna `email`, mas o código tenta selecioná-la.

## Análise
No arquivo `src/routes/admin.suporte.tsx`, a função `fetchTickets` realiza uma consulta à tabela `support_tickets` e tenta buscar informações relacionadas da tabela `profiles` através do relacionamento `user_id`. A query solicita explicitamente os campos `name` e `email`:

```typescript
.select(`
  *,
  profiles:user_id (name, email)
`)
```

Como verificado no esquema do banco de dados (`src/integrations/supabase/types.ts`), a tabela `profiles` contém apenas:
- `id`
- `name`
- `avatar_url`
- `phone`
- `created_at`
- `updated_at`

O campo `email` reside apenas na tabela interna `auth.users`, que não é diretamente acessível via PostgREST da mesma forma que as tabelas públicas sem configurações específicas de views ou campos redundantes.

## Ações Propostas

1. **Alteração de Banco de Dados (Migration)**:
   - Adicionar a coluna `email` à tabela `public.profiles`.
   - Criar um gatilho (trigger) ou sincronizar os dados existentes da tabela `auth.users` para que os perfis contenham o e-mail dos usuários, permitindo consultas eficientes.

2. **Verificação de Código**:
   - Garantir que a query em `src/routes/admin.suporte.tsx` continue solicitando o campo agora existente.
   - Opcionalmente, se não for possível alterar o banco agora, remover a solicitação do campo `email` no frontend para restaurar a funcionalidade básica. *No entanto, a recomendação é adicionar a coluna para manter a funcionalidade desejada.*

## Plano de Implementação

### 1. Banco de Dados
Executar uma migração para:
- Adicionar `email` à tabela `profiles`.
- Atualizar os registros atuais com os e-mails de `auth.users`.

### 2. Validação
- Abrir a área administrativa de suporte e verificar se os chamados carregam exibindo o nome e o e-mail do aluno.

---
Este plano resolve a causa raiz mantendo a interface de usuário intacta.