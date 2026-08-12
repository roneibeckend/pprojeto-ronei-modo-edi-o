# Plano de Correção de Texto Truncado no Mobile

O objetivo é remover ou ajustar classes de truncamento de texto que impedem a leitura completa de títulos e descrições em dispositivos móveis, garantindo uma interface mais flexível e legível.

## Alterações Propostas

### 1. Refinamento de Títulos e Labels no Shell (Menu/Navegação)
- **Arquivo:** `src/components/platform/Shell.tsx`
- **Ação:** Substituir `truncate` por quebra de linha natural em elementos onde o texto longo é comum, ou aumentar o limite de visualização.

### 2. Ajustes na Vitrine de Cursos e eBooks (Área do Aluno)
- **Arquivo:** `src/routes/app.index.tsx` e `src/routes/app.cursos.index.tsx`
- **Ação:** Aumentar ou remover `line-clamp-1` e `line-clamp-2` para permitir que títulos de cursos apareçam por completo em telas pequenas.

### 3. Melhoria na Navegação de Capítulos de E-book
- **Arquivo:** `src/routes/app.ebooks.$ebookId.tsx`
- **Ação:** Substituir `line-clamp-1` nos botões de "Anterior" e "Próximo" por uma solução que permita exibir mais do título sem quebrar o layout do botão.

### 4. Correções em Tabelas e Listas Administrativas
- **Arquivos:** `src/routes/admin.cursos.tsx`, `src/routes/admin.ebooks.tsx`, `src/routes/admin.suporte.tsx`
- **Ação:** Garantir que títulos de itens em edição e linhas de tabelas não fiquem ilegíveis no mobile.

## Detalhes Técnicos
- Utilizar `whitespace-normal` onde o truncamento for removido.
- Ajustar alturas mínimas (`min-h`) para evitar saltos de layout quando o texto quebrar em mais linhas.
- Testar especificamente em visualizações simuladas de iPhone SE e Pixel 7 (320px - 412px de largura).

## Verificação
- Validar se o texto agora "flui" para a próxima linha em vez de exibir reticências (...) em locais críticos.
- Confirmar se a responsividade geral do layout não foi comprometida.
