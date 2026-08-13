# Plano de Implementação: Editor Visual de Capítulos de E-book

Simplificar a edição de capítulos de e-books em formato HTML ou Markdown, abstraindo a complexidade técnica para uma experiência amigável e intuitiva para usuários não técnicos.

## Mudanças do Lado do Usuário

- **Interface de Edição Visual (Rich Text):** Substituição do campo de texto bruto (`textarea`) por um editor visual moderno que permite formatar texto, adicionar títulos, listas e links sem digitar código HTML ou Markdown.
- **Alternância entre Modos:** Opção para visualizar o código fonte para ajustes finos e retornar ao modo visual.
- **Preview em Tempo Real:** Visualização instantânea de como o conteúdo ficará no e-book enquanto é editado.
- **Gerenciamento Simplificado:** Botões claros para as tarefas de edição mais comuns.

## Detalhes Técnicos

- **Integração do Editor:** Implementação do `Tiptap` ou `React-Quill` (preferência por Tiptap pela modularidade) na página de administração de e-books.
- **Tratamento de Dados:** Conversão automática entre o formato interno do editor e HTML/Markdown para persistência no banco de dados (Supabase).
- **Componente `VisualChapterEditor`:** Criação de um novo componente encapsulado para gerenciar o estado e a barra de ferramentas do editor.
- **Refatoração de `admin.ebooks.tsx`:** Substituição do `textarea` na seção "Editor Area" pelo novo componente de edição visual.
- **Estilização:** Aplicação do sistema de design premium (Gold/Orange/Fire) à interface do editor.

## Próximos Passos

1. Instalar dependências necessárias (`@tiptap/react`, `@tiptap/starter-kit`, etc.).
2. Desenvolver o componente `VisualChapterEditor`.
3. Integrar o editor na rota `/admin/ebooks`.
4. Validar o fluxo de salvamento e exportação.
