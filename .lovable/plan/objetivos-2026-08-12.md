---
title: Reorganização de Módulos e Capítulos do E-book
description: Reorganizar os 26 capítulos do e-book "Do zero aos 10K" em 7 novos módulos sem alterar o conteúdo ou IDs originais.
type: feature
---

## Objetivos
Reorganizar a estrutura do e-book `id = ee1a776c-6c7d-4a88-a980-7e671ad8d4fb` para melhorar a experiência de leitura, migrando de um módulo único para 7 módulos temáticos.

## Módulos a serem criados
1.  **Módulo 1 — Introdução** (order_index: 0)
2.  **Módulo 2 — Etapa 1: Mentalidade e Oportunidade** (order_index: 1)
3.  **Módulo 3 — Etapa 2: Começando do Zero** (order_index: 2)
4.  **Módulo 4 — Etapa 3: Produto e Produção** (order_index: 3)
5.  **Módulo 5 — Etapa 4: Vendas e Faturamento** (order_index: 4)
6.  **Módulo 6 — Etapa 5: Crescimento e Escala** (order_index: 5)
7.  **Módulo 7 — Próximos Passos** (order_index: 6)

## Distribuição de Capítulos (Mapeamento Semântico)
*   **Módulo 1:**
    *   Edição revisada e ampliada
    *   Boas-vindas
    *   A história por trás do Espetinho na Veia
    *   Método Espetinho na Veia
*   **Módulo 2:**
    *   1. Por que o espetinho é uma oportunidade tão acessível
    *   2. Antes de pensar em 10K, entenda seus números
*   **Módulo 3:**
    *   3. O que você realmente precisa para começar
    *   10. Como escolher o melhor ponto de venda
*   **Módulo 4:**
    *   4. Monte um cardápio inicial que seja fácil de vender
    *   5. Como escolher a carne certa para lucrar mais
    *   6. Padronização: o detalhe que protege sua margem
    *   7. O tempero simples que o cliente reconhece
    *   8. Como assar espetinhos do jeito certo
    *   9. Acompanhamentos e apresentação: aumente valor sem confundir o negócio
*   **Módulo 5:**
    *   11. Preço certo: não venda no escuro
    *   12. Estratégias simples para vender mais todos os dias
    *   13. Atendimento que faz o cliente voltar
    *   14. Controle diário: o hábito que separa venda de negócio
    *   15. Os erros que fazem muita gente desistir
    *   16. Use a internet para fazer o cliente ir até você
*   **Módulo 6:**
    *   17. Como crescer sem perder o padrão
    *   18. O caminho para chegar aos 10 mil por mês
*   **Módulo 7:**
    *   19. Plano de ação de 30 dias
    *   20. Painel semanal do Espetinho na Veia
    *   Mensagem final
    *   Folha de ação

## Detalhes Técnicos
*   **Mecanismo:** Script SQL via `supabase--migration`.
*   **Preservação:** Os IDs de capítulos (`da11d770...`, `3b269d31...`, etc.) e o ID do e-book não serão alterados.
*   **Limpeza:** O módulo antigo `0c850947-b6e0-4eee-937f-3decb6b19c18` será removido após a migração bem-sucedida de todos os capítulos.
*   **Validação:** Verificação de contagem (7 módulos, 26 capítulos totais, 0 órfãos).
