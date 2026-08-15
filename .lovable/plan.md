# Plano de Ajuste de Layout: /app/cursos

Este plano visa otimizar a altura das imagens dos cartões de cursos e e-books na rota `/app/cursos`, garantindo que os botões de ação ("Acessar curso", "Ler e-book", "Comprar") permaneçam visíveis e acessíveis em dispositivos móveis e telas com altura reduzida.

## Alterações Propostas

### 1. Ajuste de Estilo dos Cartões
- Aplicar uma restrição de altura máxima (`max-h-[160px]`) aos containers de imagem `aspect-video`.
- Garantir que as imagens useis `object-cover` para preencher o espaço sem distorção.
- Padronizar o comportamento em todas as seções: "Seus Treinamentos", "Cursos Disponíveis" e "E-books Disponíveis".

### 2. Otimização de Esqueleto (Skeletons)
- Atualizar o `CourseCardSkeleton` em `src/components/ui/skeleton.tsx` para refletir as novas restrições de altura, mantendo a consistência visual durante o carregamento.

### 3. Refinamento de Responsividade
- Ajustar os paddings e margens internas dos cartões para economizar espaço vertical em telas pequenas.

## Detalhes Técnicos
- Arquivos afetados:
    - `src/routes/app.cursos.index.tsx`
    - `src/components/ui/skeleton.tsx`
- Tailwind classes: `max-h-[160px]`, `sm:max-h-[200px]`, `lg:max-h-none` (se necessário manter maior em desktop).

## Validação
- Teste via Playwright simulando viewport de iPhone SE (375x667) para confirmar que o botão de ação está visível sem rolagem excessiva.
