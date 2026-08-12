# Plano de Implementação: Rolagem Automática ao Topo (Mobile-Only)

Este plano descreve o refinamento da funcionalidade de rolagem automática para o topo da página, restringindo-a a dispositivos móveis e tablets, conforme solicitado.

## Motivação
Melhorar a experiência de leitura em dispositivos menores, onde a navegação para o próximo capítulo muitas vezes deixa o usuário no final da página anterior devido à altura limitada da tela e à continuidade do layout. Em desktops, a rolagem pode ser menos necessária ou até indesejada dependendo do layout lateral.

## Alterações Propostas

### Frontend

1.  **E-book Reader (`src/routes/app.ebooks.$ebookId.tsx`)**
    *   Atualizar o `useEffect` que observa `activeChapterId`.
    *   Adicionar uma verificação de largura de tela (`window.innerWidth < 1024` ou similar) para acionar a rolagem apenas em dispositivos móveis/tablets.
    *   Alternativamente, usar um hook de media query se já existir no projeto.

2.  **Course Player (`src/routes/app.cursos.$courseId.tsx`)**
    *   Atualizar o `useEffect` que observa `activeId`.
    *   Implementar a mesma lógica de detecção de dispositivo móvel.

## Detalhes Técnicos
*   Padrão de detecção: `window.innerWidth < 1024` (que abrange a maioria dos tablets e celulares).
*   Manutenção do `behavior: 'smooth'` para uma transição agradável.

## Verificação
*   Testar em resolução mobile (emulada ou real): verificar se rola ao topo ao mudar capítulo/aula.
*   Testar em resolução desktop: verificar se a rolagem automática NÃO ocorre (ou se o comportamento desejado é mantido apenas onde faz sentido).
