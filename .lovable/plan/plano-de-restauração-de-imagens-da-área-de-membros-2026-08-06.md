# Plano de Restauração de Imagens da Área de Membros

Este plano visa corrigir a exibição de capas de cursos e e-books que estão falhando devido a vínculos incorretos no banco de dados (URLs apontando para arquivos JSON em vez das imagens reais).

## 1. Causa Raiz Identificada
- **Diagnóstico:** As colunas `cover_url` nas tabelas `courses` e `ebooks` contêm URLs de metadados (ex: `.../hero-chef.asset.json`) em vez de URLs de imagem renderizáveis (ex: `/__l5e/assets-v1/...`). Tags `<img>` não conseguem exibir arquivos JSON.

## 2. Ações de Correção

### A. Migração de Dados (Supabase)
- **Atualização da Tabela `courses`:** Substituir as URLs de arquivos JSON pelas URLs reais dos assets de imagem.
  - Exemplo: `do-zero-aos-10k` -> `/__l5e/assets-v1/986a70cf-bc72-4276-8e9e-1aa0ac3e108a/hero-chef.jpeg`
- **Atualização da Tabela `ebooks`:** Realizar o mesmo procedimento para todos os e-books.

### B. Robustez no Frontend
- **Fallback Automático:** Atualizar os componentes `CourseShowcaseCard` (em `app.index.tsx`) e os cards em `app.cursos.index.tsx` e `app.ebooks.index.tsx` para:
  1. Detectar se a URL termina em `.json` e, se possível, buscar a URL real (embora a correção no banco seja a solução definitiva).
  2. Fornecer uma imagem de "placeholder" caso a URL falhe ou seja nula, evitando o ícone de imagem quebrada.

### C. Sincronização de Tipos
- Garantir que `src/lib/platform-data.ts` reflita os mesmos assets usados no banco de dados para manter a consistência entre o modo offline/mock e o modo banco de dados.

## 3. Validação
- Verificar a "Vitrine de Cursos" na home da área de membros.
- Verificar a lista de cursos em "Meus Cursos".
- Verificar a "Biblioteca de e-books".
- Confirmar que as imagens carregam rapidamente usando URLs de CDN nativas.
