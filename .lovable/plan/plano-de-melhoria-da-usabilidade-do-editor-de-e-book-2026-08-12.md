# Plano de Melhoria da Usabilidade do Editor de E-book

Melhorar a experiência de edição de capítulos de e-books na interface administrativa, expandindo as dimensões do editor de texto e otimizando o layout para evitar rolagem excessiva e facilitar a visualização do conteúdo.

## Alterações Propostas

### UI / Layout

- **Expansão do Modal Principal**: O modal de edição de e-books já ocupa `95vw`, mas vamos garantir que o contêiner interno aproveite melhor esse espaço para o editor.
- **Redimensionamento do Editor de Texto**:
    - Aumentar a altura mínima da área de edição de `600px` para um valor que se adapte melhor a telas grandes (ex: `70vh` ou um valor fixo maior).
    - Ajustar o espaçamento interno (`p-6`) e a tipografia para garantir legibilidade.
- **Otimização da Área de Metadados**: 
    - Reorganizar os campos de título, vídeo e ordem para serem mais compactos, dando prioridade visual ao campo de conteúdo (textarea).
    - Transformar o layout de grade para que o editor ocupe a maior parte da tela verticalmente.
- **Scroll Independente**: Garantir que o editor de texto tenha sua própria área de scroll funcional, permitindo editar textos longos sem perder de vista os botões de salvamento (que devem ser fixos ou facilmente acessíveis).

## Detalhes Técnicos

- Arquivo afetado: `src/routes/admin.ebooks.tsx`.
- Ajustar classes Tailwind no componente `EbookContentEditor`:
    - `min-h-[600px]` -> `min-h-[700px]` ou `flex-grow`.
    - Melhorar o gerenciamento de altura do `TabsContent` para que ele estique até o fim do modal.
- Verificar o comportamento responsivo para que em telas menores o editor ainda seja funcional.

---

I have prepared the plan to improve the e-book editor's usability by expanding its dimensions and optimizing the layout. You can review the details in the plan.
