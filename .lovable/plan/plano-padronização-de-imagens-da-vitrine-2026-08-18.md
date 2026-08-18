---
title: Padronização de Imagens da Vitrine
description: Ajustar o tamanho das imagens na vitrine do menu início para seguir o padrão da página Meus Cursos.
---

# Plano: Padronização de Imagens da Vitrine

O objetivo é garantir que as imagens dos cursos na vitrine da página inicial (`/app`) tenham a mesma visibilidade e comportamento das imagens na página "Meus Cursos" (`/app/cursos`), resolvendo o problema de corte em dispositivos móveis.

## Alterações

### Frontend

- **Arquivo `src/routes/app.index.tsx`**:
    - Localizar o componente `CourseShowcaseCard`.
    - No elemento `img`, alterar a classe `object-cover` para `object-contain sm:object-cover`.
    - Adicionar a classe `max-h-[220px]` ao container da imagem para consistência com `app.cursos.index.tsx`.
    - Garantir que o container tenha `overflow-hidden`.

## Verificação

### Testes Manuais
- Acessar a página inicial do app (`/app`).
- Verificar se as imagens da seção "Novidades para você" estão totalmente visíveis em dispositivos móveis (sem cortes laterais).
- Confirmar se o comportamento em desktop permanece como preenchimento total (`object-cover`).
