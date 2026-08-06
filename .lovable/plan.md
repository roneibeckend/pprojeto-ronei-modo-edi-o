# Plano: Aprimoramento do Menu "Meus Cursos"

Este plano descreve as modificações para transformar o menu "Meus Cursos" em uma área focada no progresso do aluno, exibindo apenas conteúdos adquiridos e uma barra de progresso detalhada.

## 1. Modificações de Dados (`src/lib/platform-data.ts`)
- Adicionar ou garantir que os cursos tenham propriedades de `status` (iniciado, finalizado) para cálculos de progresso.
- Garantir que cursos "demo" ou "ativos" estejam marcados corretamente para não serem removidos.

## 2. Componente de Progresso (`src/components/platform/ProgressSummary.tsx`)
- Criar um novo componente para exibir:
    - **Progresso total**: Média ponderada da conclusão de todos os cursos adquiridos.
    - **Cursos iniciados**: Contagem de cursos com progresso > 0 e < 100.
    - **Cursos finalizados**: Contagem de cursos com progresso == 100.
    - **Sequência (dias)**: Mock de dados de "streak" (ou leitura de metadados do usuário se disponível).

## 3. Ajustes na Rota de Cursos (`src/routes/app.cursos.index.tsx`)
- **Filtro de Exibição**: Alterar a lógica para exibir apenas cursos onde `locked: false` (adquiridos).
- **Remover Vitrine de Vendas**: Retirar a seção "Disponíveis para compra" desta página específica (ela já existe no "Início").
- **Inserção da Barra de Progresso**: Adicionar o `ProgressSummary` acima da lista de cursos.
- **Preservação de Demos**: Garantir que o filtro inclua cursos marcados como "demo" ou "ativos" mesmo que não sejam "comprados" formalmente (se aplicável).

## 4. Estilização
- Usar o sistema de design atual (Tailwind tokens, glassmorphism, gradientes de fogo/ouro) para manter a consistência visual.

---
**Observação**: Cursos que não foram adquiridos continuarão visíveis na aba "Início" (vitrine), conforme a estrutura anterior, mas a aba "Meus Cursos" passará a ser estritamente operacional para o aluno.