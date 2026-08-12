# Plano de Implementação: Rolagem Automática ao Topo na Navegação de Conteúdo

Este plano descreve a implementação da funcionalidade de rolagem automática para o topo da página ao navegar entre capítulos de e-books e aulas de cursos, garantindo uma experiência de leitura fluida em todos os dispositivos.

## Alterações Técnicas

### 1. Leitor de E-books (`src/routes/app.ebooks.$ebookId.tsx`)
- Localizar o `useEffect` que monitora `activeChapterId`.
- Atualizar a lógica para remover a restrição de largura de tela (`window.innerWidth < 1024`).
- Garantir que a rolagem ocorra sempre que o capítulo mudar, independentemente do dispositivo.
- Utilizar `window.scrollTo({ top: 0, behavior: 'smooth' })`.

### 2. Leitor de Cursos (`src/routes/app.cursos.$courseId.tsx`)
- Localizar o `useEffect` que monitora `activeId` (ID da aula).
- Atualizar a lógica para remover a restrição de largura de tela.
- Garantir que a rolagem ocorra sempre que a aula mudar.
- Utilizar `window.scrollTo({ top: 0, behavior: 'smooth' })`.

## Verificação e Qualidade
- **Cross-device**: Testar se a rolagem funciona em desktop e mobile.
- **Suavidade**: Validar se o `behavior: 'smooth'` proporciona uma transição agradável.
- **Desempenho**: Confirmar que a chamada não introduz latência ou "flicker" perceptível.

## Considerações
- Já existe uma lógica parcial para mobile que será expandida para desktop conforme solicitado.
