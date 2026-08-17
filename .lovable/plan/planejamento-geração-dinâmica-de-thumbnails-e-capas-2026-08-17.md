# Planejamento: Geração Dinâmica de Thumbnails e Capas

Este plano descreve a integração de capas visuais consistentes para o vídeo de vendas e para o eBook na Landing Page, garantindo uma estética profissional e alinhada ao conteúdo.

## Alterações

### 1. Landing Page (`src/routes/index.tsx`)
- **Seção Hero:** Atualizar o `thumbnail` do vídeo de vendas para uma versão processada e "limpa", removendo elementos de interface do YouTube da visualização inicial.
- **Seção de Oferta:** Inserir a imagem da capa do eBook "Do zero aos 10K" na `Offer card`. Atualmente, a seção utiliza apenas textos e efeitos de brilho; a adição da capa tangibiliza o produto digital.
- **Ajuste de Texto:** Aplicar a correção visual no elemento `span` solicitada (mudança de caractere invisível para consistência de renderização).

### 2. Componente de Vídeo (`src/components/platform/VideoPlayer.tsx`)
- Garantir que o `poster` (thumbnail) seja carregado corretamente antes da interação do usuário, otimizando o LCP (Largest Contentful Paint).

## Detalhes Técnicos
- Utilização de `object-contain` na capa do eBook para evitar cortes em dispositivos móveis.
- Otimização de imagens via `loading="eager"` para elementos acima da dobra (Hero) e `lazy` para a seção de oferta.
- Manutenção da paleta de cores Premium (Gold/Orange/Fire) nas bordas e sombras das novas imagens.
