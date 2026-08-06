---
name: Novo Painel Administrativo (/admin)
description: Reestruturação completa da área administrativa para um caminho isolado (/admin) com foco em gestão de cursos e e-books.
type: feature
---

# Plano: Novo Painel Administrativo (/admin)

O objetivo é criar uma interface administrativa moderna, isolada e robusta para gerenciar o catálogo de produtos (cursos e e-books), separando-a da experiência do aluno e do "Cockpit" administrativo atual em `/app/admin`.

## 1. Arquitetura de Rotas
- **Novo Root do Admin:** `src/routes/admin.tsx` (Layout principal com sidebar dedicada).
- **Dashboard Admin:** `src/routes/admin.index.tsx` (Visão geral operacional).
- **Gestão de Cursos:** `src/routes/admin.cursos.tsx` (Lista e CRUD de cursos).
- **Gestão de E-books:** `src/routes/admin.ebooks.tsx` (Lista e CRUD de e-books).
- **Segurança:** Todas as rotas sob `/admin` usarão o middleware de autenticação e verificação de papel 'admin'.

## 2. Interface e UX
- **Design System:** Manter a identidade visual "Brasa/Espetinho" (Laranja/Preto), mas com uma densidade maior de informações voltada para produtividade.
- **Sidebar dedicada:** Menu lateral exclusivo para o admin com:
  - Dashboard
  - Catálogo de Cursos
  - Biblioteca de E-books
  - Alunos & Matrículas (vincular ao existente)
  - Configurações do Sistema
- **Componentes CRUD:** Tabelas ricas com busca, filtros por status/data e ações rápidas (editar, excluir, duplicar).

## 3. Funcionalidades de Gestão
- **Cursos:** 
  - Upload de capas.
  - Definição de preços e badges.
  - Status (Rascunho/Publicado).
  - Gestão de módulos e lições (integração com `courses` table).
- **E-books:**
  - Upload de arquivos PDF.
  - Metadados (páginas, categoria).
  - Integração com o gerador IA e uploads manuais.

## 4. Banco de Dados e API
- Reutilizar as tabelas `public.courses`, `public.ebooks` e `public.live_classes`.
- Refinar as RLS para garantir que apenas admins possam realizar mutações.
- Criar novos Server Functions em `src/lib/admin.functions.ts` para operações em lote ou complexas.

## 5. Próximos Passos (Implementação)
1. Criar a estrutura de diretórios e rotas sob `src/routes/admin/`.
2. Implementar o `AdminLayout` em `src/routes/admin.tsx`.
3. Migrar e aprimorar a lógica de `app.admin.conteudo.tsx` para as novas rotas `admin.cursos.tsx` e `admin.ebooks.tsx`.
4. Adicionar link de acesso rápido para o novo `/admin` no Cockpit atual para facilitar a transição.
