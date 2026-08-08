# Plano de Otimização da Área do Aluno

Este plano detalha as etapas para otimizar o desempenho da área do aluno (`/app`), focando em carregamento sob demanda (code splitting) e implementação de placeholders (skeletons).

## 1. Carregamento sob Demanda (Code Splitting)
TanStack Start já realiza code splitting por rota automaticamente. No entanto, podemos otimizar componentes pesados ou modais que não são necessários imediatamente.

- [ ] Identificar componentes pesados na área do aluno (ex: StoryPlayer, VideoPlayer, Chart/Gráficos se houver).
- [ ] Utilizar `React.lazy` para esses componentes dentro dos arquivos das rotas.
- [ ] Envolver as rotas ou seções específicas com `<Suspense>`.

## 2. Implementação de Skeletons (Placeholders)
Atualmente, as telas podem apresentar "saltos" (layout shift) ou telas brancas enquanto os dados do Supabase são carregados.

- [ ] Criar componentes de Skeleton universais (CourseCardSkeleton, ListSkeleton, StatsSkeleton) em `src/components/ui/skeleton.tsx` (se ainda não existir).
- [ ] Integrar Skeletons nos loaders e estados de carregamento de:
    - [ ] `app.index.tsx` (Vitrine de cursos)
    - [ ] `app.cursos.index.tsx` (Meus cursos)
    - [ ] `app.perfil.tsx` (Dados do perfil e histórico)
    - [ ] `app.suporte.tsx` (Lista de tickets)
    - [ ] `app.ebooks.$ebookId.tsx` e `app.cursos.$courseId.tsx` (Estrutura de módulos)

## 3. Melhorias de Performance Adicionais
- [ ] Implementar `prefetch` em links de navegação crítica.
- [ ] Otimizar imagens de capa de cursos para carregamento progressivo.
- [ ] Garantir que consultas ao Supabase utilizem filtros eficientes e tragam apenas colunas necessárias.

## Cronograma de Execução
1. **Passo 1**: Criação dos componentes de Skeleton.
2. **Passo 2**: Refatoração das rotas principais para usar estados de carregamento visuais.
3. **Passo 3**: Lazy loading de componentes de mídia pesados.
4. **Passo 4**: Verificação final de performance (Lighthouse/Network tab).
