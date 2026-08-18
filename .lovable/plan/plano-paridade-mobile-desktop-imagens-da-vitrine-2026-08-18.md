---
title: Paridade Mobile/Desktop - Imagens da Vitrine
description: Replicar a configuração de visualização de imagens da vitrine (object-contain/cover) para a versão desktop, garantindo consistência visual.
---

# Plano: Paridade Mobile/Desktop - Imagens da Vitrine

O objetivo é garantir que a alteração de visualização de imagens ("object-contain" em telas pequenas e "object-cover" em telas maiores), implementada recentemente para resolver cortes em dispositivos móveis na vitrine da página inicial (`/app`), seja aplicada de forma consistente e verificada em desktop.

## Alterações

### Frontend

- **Arquivo `src/routes/app.index.tsx`**:
    - Verificar se o componente `CourseShowcaseCard` já possui a classe `object-contain sm:object-cover` aplicada à imagem.
    - Confirmar se o container da imagem possui `max-h-[220px]` e `overflow-hidden`.
    - Esta alteração já foi feita no turno anterior para resolver o problema mobile, e o `sm:object-cover` garante que no desktop (telas > 640px) a imagem continue preenchendo o espaço (`object-cover`) conforme o padrão.

## Verificação

### Testes Manuais (Simulação Desktop)
- Acessar a página inicial do app (`/app`) em um navegador desktop.
- Verificar se as imagens da seção "Novidades para você" preenchem corretamente o container (comportamento `object-cover`).
- Redimensionar a janela para tamanhos menores e confirmar a transição para `object-contain` (onde a imagem inteira fica visível sem cortes).
- Comparar visualmente com a página "Meus Cursos" (`/app/cursos`) para garantir paridade total.
