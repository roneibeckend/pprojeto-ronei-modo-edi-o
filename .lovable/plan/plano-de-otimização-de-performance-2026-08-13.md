# Plano de Otimização de Performance

Este plano foca em otimizar o desempenho das consultas SQL e a lógica de acesso a dados no projeto para reduzir o tempo de resposta e o consumo de recursos.

## Mudanças Propostas

### 1. Otimização de Consultas SQL (Backend/Supabase)
*   **Seleção Seletiva de Colunas:** Revisar chamadas `supabase.from().select('*')` para selecionar apenas as colunas necessárias, reduzindo o payload de rede e o uso de memória no cliente.
*   **Filtros no Lado do Servidor:** Garantir que filtros como `status !== 'archived'` e `is_locked === false` sejam aplicados diretamente na query do Supabase, não via `.filter()` no JavaScript.
*   **Índices no Banco de Dados:** Criar índices em colunas frequentemente usadas em filtros (`status`, `is_locked`, `created_at`, `user_id`, `ebook_id`, `course_id`).

### 2. Melhorias na Lógica de Dados (Frontend)
*   **Estratégias de Caching:** Ajustar `staleTime` e `gcTime` no TanStack Query para dados que não mudam frequentemente (ex: lista de cursos, informações do perfil).
*   **Paginação e Limites:** Implementar limites de busca (`.limit(n)`) em áreas críticas para evitar o carregamento de grandes volumes de dados desnecessários.
*   **Parallel Fetching:** Otimizar buscas paralelas onde aplicável para reduzir o tempo total de carregamento das páginas.

### 3. Refatoração de Componentes Específicos
*   **Dashboard (`/app/index.tsx`):** Otimizar a busca de itens do showcase.
*   **Lista de Cursos (`/app/cursos/index.tsx`):** Refinar os filtros de matrícula e status.
*   **Hooks de Enrollments/Progress:** Otimizar o cache e a frequência de re-fetch.

## Detalhes Técnicos
*   Utilização de `select('col1, col2, col3')` em vez de `select('*')`.
*   Migração SQL para adição de índices:
    ```sql
    CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
    CREATE INDEX IF NOT EXISTS idx_ebooks_status ON public.ebooks(status);
    CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON public.course_enrollments(user_id);
    ```
*   Configuração global de `QueryClient` para defaults de performance mais agressivos.

## Validação e Monitoramento
*   Monitoramento manual via Network tab do navegador (tamanho de payload e tempo de resposta).
*   Verificação de métricas de CPU/Memória no dashboard do Supabase (via `supabase--db_health`).
*   Testes de regressão nas rotas principais (`/app`, `/app/cursos`, `/admin`).
