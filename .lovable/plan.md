# Plano: Ajuste de Tamanho das Imagens em "Seus Treinamentos"

O objetivo é padronizar o tamanho das imagens da seção "Seus Treinamentos" na página `/app/cursos` para que fiquem visualmente alinhadas com a seção de E-books, resolvendo a quebra de layout e excesso de dimensões atuais.

## Alterações

### Frontend

- **src/routes/app.cursos.index.tsx**:
    - Alterar o `aspect-ratio` do container de imagem de `aspect-video` para `aspect-[3/4]` (formato retrato/capa de livro) para os cursos adquiridos.
    - Ajustar a classe da imagem para garantir `object-cover` e evitar distorções.
    - Otimizar o grid layout da seção para comportar melhor o formato vertical.
    - Aplicar os mesmos ajustes na seção de "Cursos Disponíveis" para manter a consistência visual em toda a página.

## Detalhes Técnicos

- Utilização de classes utilitárias do Tailwind CSS.
- Preservação da lógica de `group-hover:scale-110` para interatividade.
- Ajuste de `max-height` se necessário para garantir que as capas não fiquem excessivamente longas em telas grandes.

## Validação

- Acesso manual à rota `/app/cursos`.
- Comparação visual entre as seções de Cursos e E-books.
- Teste de responsividade (mobile vs desktop) via ferramentas de desenvolvedor.
