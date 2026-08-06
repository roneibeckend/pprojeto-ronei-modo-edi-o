# Plano de Restauração de Imagens da Área de Membros

Este plano visa corrigir a exibição de capas de cursos e e-books que estão ausentes na área de membros, garantindo que as imagens originais vinculadas aos dados estáticos e ao banco de dados sejam exibidas corretamente.

## 1. Diagnóstico da Causa Raiz
- **Cursos:** As rotas `/app/index` e `/app/cursos/index` estão buscando dados do banco de dados (`supabase.from("courses")`). O campo esperado é `cover_url`, mas os dados estáticos em `src/lib/platform-data.ts` usam o campo `cover`.
- **E-books:** A rota `/app/ebooks/index` usa dados estáticos de `src/lib/platform-data.ts` onde as imagens estão vinculadas via `IMG` object (assets locais).
- **Inconsistência:** É provável que as linhas no banco de dados para `courses` tenham o campo `cover_url` vazio ou apontando para caminhos inexistentes, enquanto o código prioriza esses dados dinâmicos sobre os estáticos que possuem as URLs corretas dos assets.

## 2. Ações de Correção

### A. Sincronização de Dados (Banco de Dados)
- Executar uma migração SQL para atualizar a tabela `public.courses`, garantindo que o campo `cover_url` aponte para as URLs válidas dos assets locais (ex: `/__l5e/assets-v1/...`) que já estão mapeadas no `platform-data.ts`.

### B. Ajuste nos Componentes de UI
- **CourseShowcaseCard:** Adicionar uma lógica de fallback no componente de exibição. Se `course.cover_url` estiver ausente, tentar usar uma imagem padrão baseada no `course.id` mapeado no arquivo de dados estáticos.
- **E-books:** Verificar se o mapeamento `ebooks` em `src/lib/platform-data.ts` está sendo consumido corretamente e se as URLs dos assets `.asset.json` estão resolvidas.

### C. Otimização de Carregamento
- Manter o uso de `loading="lazy"` em todas as imagens.
- Adicionar uma cor de fundo ou placeholder enquanto a imagem carrega para evitar layout shift.

## 3. Validação
- Abrir a área de membros e verificar se as capas de todos os cursos (Showcase e Lista) e E-books estão visíveis.
- Testar o comportamento quando o banco de dados retorna uma imagem nula (o fallback deve funcionar).
