---
name: Restaurar Cor Laranja no Menu
description: Restauração da identidade visual laranja no menu de navegação lateral (sidebar).
type: design
---

# Plano: Restaurar Cor Laranja no Menu

O objetivo é retornar o menu lateral (sidebar) à sua cor de destaque laranja original (#ff6a00) para manter a consistência visual com o restante da plataforma.

## 1. Ajuste de Tokens Globais
- Modificar `--sidebar-background` em `src/styles.css` para `#ff6a00`.
- Ajustar `--sidebar-foreground` e `--sidebar-border` para garantir legibilidade (tons escuros sobre o fundo vibrante).

## 2. Refatoração de Componentes (Shell.tsx)
- Atualizar o componente `Shell.tsx` para garantir que os ícones, textos e estados ativos (active) contrastem corretamente com o novo fundo laranja.
- Substituir o uso de `text-primary` (que se camuflaria no fundo) por tons escuros (`text-black/80`).
- Ajustar o estilo dos itens ativos para usarem um fundo escuro (`bg-black`) com texto branco para máxima distinção.

## 3. Verificação Visual
- Validar a legibilidade do menu lateral em diferentes resoluções.
- Garantir que o contraste atenda aos padrões básicos de acessibilidade sobre o fundo laranja.
