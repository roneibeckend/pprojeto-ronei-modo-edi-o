# Plano de Implementação: Arrastar e Soltar (Drag-and-Drop) para Capítulos

O objetivo é permitir que o administrador reordene os capítulos de um e-book de forma intuitiva, arrastando-os na barra lateral da interface administrativa.

## Alterações Propostas

### 1. Instalação de Dependência
- Instalar `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` e `@dnd-kit/modifiers`. Essas bibliotecas são o padrão moderno para acessibilidade e performance em React.

### 2. Interface Administrativa (`src/routes/admin.ebooks.tsx`)
- Envolver a lista de capítulos em cada módulo com um `DndContext`.
- Usar `SortableContext` para definir a lista de itens ordenáveis.
- Criar um componente `SortableChapterItem` para gerenciar o estado de cada linha de capítulo.
- Adicionar um "handle" visual (ícone `GripVertical`) para indicar onde o usuário pode clicar para arrastar.
- Implementar a função `handleDragEnd` para capturar a nova ordem e chamar a função de backend já existente `reorderChapter`.

### 3. Feedback Visual
- O item sendo arrastado terá uma opacidade reduzida ou uma borda destacada.
- Espaço reservado (placeholder) indicará onde o item será solto.

## Detalhes Técnicos
- **Estratégia**: `verticalListSortingStrategy`.
- **Persistência**: Utilizará a função `reorderChapter` (já implementada em `src/lib/ebook-reorder.functions.ts`), que atualiza o `order_index` no banco de dados via Supabase.
- **Segurança**: A operação de reordenação respeita as políticas de RLS já configuradas para administradores.

## Próximos Passos
1. Instalar pacotes via npm.
2. Refatorar a renderização da árvore de capítulos para suportar o DnD.
3. Testar a persistência no banco de dados após o movimento.
