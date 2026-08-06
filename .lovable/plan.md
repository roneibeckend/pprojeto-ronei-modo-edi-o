# Plano: Sistema de Gerenciamento de Cursos (LMS)

Implementar a estrutura de dados e a interface administrativa para cursos, replicando o modelo de sucesso dos e-books, com foco em modularidade, reordenamento e controle de acesso.

## 1. Modelo de Dados (Supabase)
Criar migração SQL para as tabelas solicitadas:
- `courses`: Metadados do curso.
- `course_modules`: Agrupadores de aulas.
- `course_lessons`: Aulas com vídeo, duração e conteúdo.
- `lesson_materials`: Anexos para download.
- `lesson_progress`: Rastreamento de conclusão do aluno.
- Configurar RLS e Grants para `authenticated` e `service_role`.
- Criar bucket `course-assets` para capas e materiais.

## 2. API e Lógica de Servidor
- Criar `src/lib/courses.functions.ts` para gerenciar CRUD de cursos, módulos e aulas.
- Implementar `upsertCourse`, `upsertModule`, `upsertLesson`.
- Implementar reordenamento em lote (`updateOrders`).

## 3. Interface Administrativa (/admin/cursos)
- **Listagem**: Tabela robusta com busca, filtros e ações (editar, duplicar, status).
- **Editor Principal**:
    - Aba **Informações**: Título, slug, descrição, upload de capa e vídeo de intro.
    - Aba **Conteúdo**: Estrutura em árvore.
        - Drag & Drop para módulos e aulas.
        - Dialogs para edição rápida de cada nível.
        - Editor de aula com Rich Text e gerenciador de materiais.
    - Aba **Alunos**: Visualização de progresso dos alunos matriculados.

## 4. Reutilização e Componentes
- Adaptar o `ImageUpload` para o novo bucket.
- Criar `CourseTreeEditor` baseado na experiência do `EbookChaptersEditor`.
- Integrar `dnd-kit` para a interface de arrastar e soltar.

## 5. Validação e Segurança
- Validação com `zod` e `react-hook-form` em todos os formulários.
- Garantir que as rotas `/admin/*` e `/app.admin/*` respeitem o papel `admin`.
- Invalidação de cache via TanStack Query após mutações.

