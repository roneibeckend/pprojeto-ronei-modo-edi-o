# Plano de Implementação: Filtro de Rascunhos na Interface do Aluno (/app)

Este plano detalha as alterações necessárias para garantir que cursos, e-books e receitas com status de "rascunho" não sejam visíveis nem acessíveis para usuários finais na interface `/app`, preservando o acesso na área administrativa.

## Alterações Sugeridas

### 1. Frontend: Refinamento de Filtros nas Listagens

*   **Página Inicial do App (`src/routes/app.index.tsx`):**
    *   Ajustar a query de `showcase-items` para garantir que apenas itens com `status` 'active' ou 'published' sejam buscados.
    *   Embora a query já possua `.in("status", ["active", "published"])`, revisaremos se há algum vazamento de dados em estados derivados.

*   **Página de Cursos (`src/routes/app.cursos.index.tsx`):**
    *   Atualizar as queries `useQuery` para `courses` e `ebooks`.
    *   Adicionar `.eq("status", "published")` (ou os status equivalentes a finalizados) explicitamente em ambas as buscas.
    *   Remover o filtro manual de `archived`/`deleted` se o filtro positivo por `published` for aplicado.

*   **Página de Receitas (`src/routes/app.receitas.tsx`):**
    *   Garantir que o `useEffect` que busca as receitas mantenha o filtro `.eq("is_published", true)`.

### 2. Backend & Segurança: Proteção de Acesso Direto

*   **Loader da Rota de Detalhe do Curso (`src/routes/app.cursos.$courseId.tsx`):**
    *   A query no `loader` já utiliza `.in("status", ["active", "published"])`. Manteremos essa restrição para evitar que um usuário acesse um rascunho via URL direta.

*   **Loader da Rota de Detalhe do E-book (`src/routes/app.ebooks.$ebookId.tsx`):**
    *   A query no `loader` já utiliza `.in("status", ["active", "published"])`. Manteremos essa restrição.

*   **Server Functions de Vídeos e Materiais:**
    *   `src/lib/video.functions.ts` (`getSignedVideoUrl`): Adicionar uma verificação de status do curso/e-book pai. Se o conteúdo for rascunho e o usuário não for admin, negar a geração da URL assinada.
    *   `src/lib/materials.functions.ts` (`getMaterialDownloadUrl`): Implementar lógica similar para materiais vinculados a conteúdos não publicados.

### 3. Área Administrativa (Sem alterações de filtro)

*   As rotas `/admin/cursos`, `/admin/ebooks` e `/admin/materiais` continuarão exibindo todos os status (rascunho, publicado, etc.) para permitir a gestão contínua.

## Detalhes Técnicos

*   **Status Válidos para /app:** `active`, `published`.
*   **Status Ocultos em /app:** `draft`, `in_review`, `pending`, `archived`, `deleted`.
*   **Segurança:** A filtragem será feita no nível da query do Supabase (Client e Server-side) para garantir que rascunhos nunca cheguem ao bundle do cliente em rotas de usuário.

---
Este plano garante uma transição suave entre o desenvolvimento e o lançamento, evitando que alunos vejam conteúdos incompletos.
