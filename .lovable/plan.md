# Plano de Implementação: Diferenciação entre Usuário e Aluno

Este plano estabelece uma distinção clara entre usuários que apenas se cadastraram e usuários que concluíram uma compra (alunos), automatizando a transição de status.

## Alterações no Banco de Dados

1.  **Adição da Coluna de Status**:
    *   Adicionar coluna `status` à tabela `public.profiles` com valores: `'lead'` (padrão) e `'student'`.
    *   Conceder permissões necessárias e habilitar RLS.
    *   Migrar usuários existentes: aqueles com entradas em `course_enrollments` ou `ebook_enrollments` serão marcados como `'student'`, os demais como `'lead'`.

2.  **Gatilho de Transição Automática**:
    *   Criar função `public.promote_to_student()` que atualiza o status no `profiles` para `'student'`.
    *   Criar gatilhos nas tabelas `course_enrollments` e `ebook_enrollments` para chamar essa função após cada inserção bem-sucedida.

## Alterações no Backend (Webhooks)

1.  **Atualização do Webhook Asaas**:
    *   Garantir que o processo de liberação de acesso (que insere nas tabelas de matrícula) dispare o gatilho de transição de status.
    *   O fluxo atual já insere em `course_enrollments`/`ebook_enrollments`, então o gatilho de banco de dados cuidará da automação sem necessidade de lógica extra complexa no webhook.

## Alterações no Frontend

1.  **Hook `useAuth`**:
    *   Atualizar para expor `isStudent: profile?.status === 'student'`.

2.  **Painel Administrativo**:
    *   **Gestão de Equipe (`/admin/usuarios`)**: Adicionar coluna visual de "Status" (Lead vs Aluno).
    *   **Gestão de Alunos (`/admin/alunos`)**: Adicionar filtro ou rótulo para diferenciar alunos pagantes de leads.
    *   **Dashboard Admin**: Adicionar métrica de conversão (Leads -> Alunos).

## Detalhes Técnicos

```sql
-- Exemplo da migração
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'lead';

-- Função de promoção
CREATE OR REPLACE FUNCTION public.promote_to_student()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles SET status = 'student' WHERE id = NEW.user_id AND status = 'lead';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

O sistema passará a distinguir automaticamente quem apenas se cadastrou de quem efetivamente adquiriu um produto, facilitando ações de marketing e controle de acesso.
