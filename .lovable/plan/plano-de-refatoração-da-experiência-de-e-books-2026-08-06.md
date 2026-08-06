# Plano de Refatoração da Experiência de E-books

Refatoração completa do layout de exibição de e-books e do leitor de capítulos, focando em uma interface robusta, modular e centrada no vídeo.

## 1. Banco de Dados (Correção e Estrutura)

### Ações:
- **Auditoria de Migração**: Identificamos que a migração anterior era aditiva, mas limitada a 1 capítulo por e-book (proveniente da coluna `content`).
- **Nova Estrutura Modular**:
    - Criação da tabela `ebook_modules` para agrupar capítulos.
    - Atualização de `ebook_chapters` com `module_id` e `slug`.
    - Adição de `video_url` à tabela `ebooks` (para a aula introdutória).
- **Seed de Validação**: 
    - Popular o e-book `guia-completo` com 3 módulos e 3 capítulos cada (total 9 capítulos).
    - Conteúdos de exemplo marcados como "seed".

## 2. Refatoração da Página do E-book (`/app/ebooks/$ebookId`)

### Mudanças no Layout:
- **Centralização**: Layout de coluna única (`max-w-5xl`) removendo a sidebar.
- **Header Sticky**: Compacto (64px) com link de volta, título e barra de progresso.
- **Hero de Vídeo**: 
    - Player 16:9 centralizado com efeito "glow" laranja.
    - Badge "AULA INTRODUTÓRIA".
    - Metadados: nº de módulos, capítulos e tempo estimado.
    - Placeholder elegante caso o vídeo não exista.
- **Grade de Conteúdo**:
    - Accordion (shadcn) para módulos.
    - Cabeçalhos de módulo com mini barra de progresso.
    - Lista de capítulos com ícones de status dinâmicos (pendente, em andamento, concluído).
    - Efeito de elevação (`hover`) nos capítulos.

## 3. Nova Rota de Leitura (`/app/ebooks/$ebookId/capitulo/$chapterSlug`)

### Funcionalidades:
- **Design de Leitura**: Tipografia `prose-invert` com largura otimizada (`68ch`).
- **Suporte a Vídeo**: Player no topo se o capítulo possuir vídeo próprio.
- **Navegação Inteligente**:
    - Rodapé com "Anterior" e "Próximo" exibindo os títulos.
    - Botão "Marcar como concluído" com transição automática.
    - Link "Voltar ao índice" fixo no topo.

## 4. Melhorias Técnicas e UI
- **Performance**: Skeletons de carregamento via TanStack Query.
- **Animações**: Framer Motion para transições de entrada (fade+slide).
- **Tokens Semânticos**: Uso estrito do sistema de cores do projeto (Ember/Flame/Gold).

## Relatório de Execução (Será gerado após conclusão)
- Confirmação de migrações aditivas.
- Contagem final de módulos e capítulos no e-book principal.
- Lista de novos arquivos e componentes criados.
