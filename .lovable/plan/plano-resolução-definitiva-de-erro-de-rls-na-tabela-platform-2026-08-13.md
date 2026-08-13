# Plano: Resolução Definitiva de Erro de RLS na Tabela `platform_materials`

Identifiquei que, apesar das correções anteriores na UI, a causa raiz do erro de RLS (`new row violates row-level security policy`) persiste. Isso ocorre porque as políticas de segurança de linha para `INSERT` e `UPDATE` na tabela `platform_materials` podem estar entrando em conflito com a forma como o `createServerFn` (rodando no servidor) interage com o Supabase usando o contexto do usuário.

## Alterações Propostas

### 1. Diagnóstico de Permissões e Políticas
- Realizar uma inspeção profunda das políticas atuais de RLS para a tabela `platform_materials`.
- Verificar se a função `has_role(auth.uid(), 'admin')` está retornando corretamente para o usuário logado no momento da inserção.
- Investigar se há políticas de `WITH CHECK` que impedem a inserção de novos registros mesmo para administradores.

### 2. Backend (Banco de Dados)
- Atualizar a política de RLS para ser mais robusta, garantindo que o `service_role` tenha acesso total e que o papel `admin` tenha permissões explícitas de `INSERT`, `UPDATE` e `DELETE`.
- Garantir que as permissões de `GRANT` foram aplicadas corretamente para todos os papéis relevantes (`authenticated`, `service_role`).

### 3. Funções do Servidor
- **src/lib/materials.functions.ts**:
    - Revisar a chamada `upsert` na função `upsertMaterial`.
    - Se a operação continuar falhando com o cliente autenticado (devido a peculiaridades do RLS em `upsert`), avaliar o uso do cliente admin (`supabaseAdmin`) dentro do servidor apenas para esta operação administrativa, após validar manualmente o papel do usuário.

### 4. Frontend
- **src/routes/admin.materiais.tsx**:
    - Melhorar o tratamento de erro no `onError` da mutação para capturar detalhes adicionais que ajudem na depuração se o erro persistir em ambientes de teste.

## Detalhes Técnicos
- Refinamento das políticas SQL:
    ```sql
    ALTER TABLE public.platform_materials ENABLE ROW LEVEL SECURITY;
    GRANT ALL ON public.platform_materials TO authenticated, service_role;
    ```
- Verificação do uso de `upsert` vs `insert/update` separados caso o RLS do Postgres apresente comportamento inesperado com `ON CONFLICT`.
