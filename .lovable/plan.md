# Plano de Correção: Registro e Visibilidade de Usuários

Este plano aborda a atribuição incorreta do nome "Andre Silva" ao usuário `bitvakinha@gmail.com` e a falha de visibilidade do registro no painel administrativo.

## Problemas Identificados

1.  **Nome Incorreto**: O nome "Andre Silva" está sendo exibido para o novo usuário porque é o valor padrão (mock) definido no objeto `student` em `src/lib/platform-data.ts`. Vários componentes da interface, como a barra lateral (`Shell.tsx`) e a página inicial (`app.index.tsx`), utilizam esse objeto estático em vez dos dados reais do banco de dados.
2.  **Inconsistência de Dados**: O usuário `bitvakinha@gmail.com` existe na tabela `auth.users` com o nome "Pedro Paulo" em seus metadados, mas não possui um registro correspondente na tabela `public.profiles`.
3.  **Visibilidade no Admin**: O painel administrativo (`admin.usuarios.tsx` e `admin.alunos.tsx`) busca dados na tabela `public.profiles`. Como o perfil não foi criado, o usuário não aparece nas listagens.
4.  **Falha no Gatilho (Trigger)**: O sistema não possui um gatilho de banco de dados (trigger) para criar automaticamente um perfil na tabela `public.profiles` quando um novo usuário se cadastra via Supabase Auth.

## Ações Propostas

### 1. Banco de Dados (Supabase)
*   **Criar Gatilho de Autocadastro**: Implementar uma função SQL e um gatilho (`AFTER INSERT ON auth.users`) para criar automaticamente um registro em `public.profiles`.
    *   O nome será extraído de `raw_user_meta_data->>'name'`.
    *   Se não houver nome nos metadados, será usado o prefixo do e-mail ou "Estudante".
*   **Corrigir Registros Existentes**: Executar um script SQL para criar perfis faltantes para usuários já cadastrados (incluindo `bitvakinha@gmail.com`).

### 2. Interface (Frontend)
*   **Remover Mocks Estáticos**:
    *   Atualizar `Shell.tsx` para exibir o nome e avatar do usuário logado (via `useAuth` e consulta ao perfil real) em vez de usar o objeto `student`.
    *   Atualizar `app.index.tsx` para não depender de `student.lastLesson.courseId` para lógica de fallback.
*   **Padronização do Perfil**: Garantir que `app.perfil.tsx` e as telas administrativas usem os mesmos campos de nome (`name`) de forma consistente.

### 3. Painel Administrativo
*   **Verificação de RLS**: Confirmar se as políticas de Segurança em Nível de Linha (RLS) permitem que administradores visualizem todos os perfis (já verificado como correto, mas será revalidado após as mudanças).

## Detalhes Técnicos

*   **Migração SQL**:
    ```sql
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, name, email)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email
      );
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    ```
*   **Componentes Afetados**:
    *   `src/components/platform/Shell.tsx`: Trocar `student.name` por `profile?.name || user?.email`.
    *   `src/routes/app.index.tsx`: Ajustar lógica de fallback.
    *   `src/hooks/use-auth.ts`: Garantir que os dados do perfil sejam carregados e expostos.

---
**Resultado Esperado**: O usuário `bitvakinha@gmail.com` aparecerá como "Pedro Paulo" (ou o nome fornecido no cadastro) em toda a plataforma e será visível para administradores em `/admin/alunos` e `/admin/usuarios`.
