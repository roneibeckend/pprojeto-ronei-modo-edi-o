# Plano de Consolidação da Área Administrativa

Este plano visa unificar as funcionalidades da área administrativa antiga (`/app/admin`) na nova área administrativa (`/admin`), removendo a duplicidade e garantindo uma interface única e moderna para o administrador.

## 1. Mapeamento de Funcionalidades e Rotas

### Área Antiga (`/app/admin`)
- `/app/admin/index.tsx`: Dashboard (Cockpit) com KPIs e atalhos.
- `/app/admin/financeiro.tsx`: Gestão de custos, lucros e sócios.
- `/app/admin/alunos.tsx`: Tabela analítica de alunos (estática/mock).
- `/app/admin/conteudo.tsx`: CRUD de Cursos e E-books manuais.
- `/app/admin/ao-vivo.tsx`: Gestão de aulas ao vivo.
- `/app/admin/ebook-ai.tsx`: Gerador de e-books com IA.

### Área Nova (`/admin`)
- `/admin/index.tsx`: Dashboard dinâmico (já integrado com Supabase).
- `/admin/cursos.tsx`: CRUD de cursos (completo).
- `/admin/ebooks.tsx`: CRUD de e-books (completo).
- `/admin/receitas.tsx`: CRUD de receitas (completo).
- `/admin/alunos.tsx`: Gestão de alunos (completo).
- `/admin/integracoes.tsx`: Hub de integrações (IA/Pagamentos).

## 2. Ações de Migração e Consolidação

### Migração de Telas Faltantes para `/admin`
1. **Financeiro**: Criar `src/routes/admin.financeiro.tsx` movendo a lógica de `/app/admin/financeiro.tsx`.
2. **Aulas ao Vivo**: Criar `src/routes/admin.ao-vivo.tsx` movendo a lógica de `/app/admin/ao-vivo.tsx`.
3. **Gerador de E-book IA**: Criar `src/routes/admin.ebook-ai.tsx` movendo a lógica de `/app/admin/ebook-ai.tsx`.

### Atualização da Sidebar da Nova Área
- Adicionar os novos itens (Financeiro, Ao Vivo, E-book IA) ao menu lateral em `src/routes/admin.tsx`.

### Desativação e Redirecionamento
- Modificar `src/routes/app.admin.tsx` (layout pai da área antiga) para redirecionar automaticamente qualquer acesso para `/admin`.
- Remover as referências de link para `/app/admin` no menu lateral do aluno (`src/components/platform/Shell.tsx`), apontando para `/admin`.

## 3. Validação Técnica
- Garantir que as importações de componentes e funções (`PageHeader`, `supabase`, `saveContent`, etc.) em `src/routes/admin.*` estejam corretas após a mudança de diretório.
- Verificar se o controle de acesso (`useAuth`) está consistente em todas as novas rotas.
- Testar o redirecionamento de `/app/admin/*` para `/admin/*`.

## 4. Limpeza (Opcional/Futura)
- Excluir fisicamente os arquivos em `src/routes/app.admin.*.tsx` após confirmar a estabilidade da nova área.
