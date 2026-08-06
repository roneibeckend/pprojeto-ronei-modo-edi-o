# Plano: Restauração da Vitrine de Cursos Disponíveis para Compra

O objetivo é restaurar a visibilidade dos cursos não adquiridos na aba "Meus Cursos", mantendo a barra de progresso para os cursos que o aluno já possui.

## 1. Ajustes na Rota de Cursos (`src/routes/app.cursos.index.tsx`)
- **Restaurar Lógica de Filtro**: Voltar a separar os cursos entre `owned` (adquiridos) e `others` (disponíveis para compra).
- **Adicionar Seção de Compras**: Reintroduzir a seção "Disponíveis para compra" abaixo da lista de cursos do aluno.
- **Manter Barra de Progresso**: A barra de progresso (componente `ProgressSummary`) continuará no topo da página, refletindo apenas o progresso dos cursos adquiridos.

## 2. Reutilização de Componentes
- Utilizar o componente de card de curso já estilizado na rota para manter a consistência visual.

## 3. Validação
- Verificar se a seção "Disponíveis para compra" exibe corretamente o preço e o botão de compra.
- Garantir que cursos finalizados/em andamento continuem aparecendo apenas na seção superior.

---
**Observação**: Esta alteração reverte a decisão anterior de remover a vitrine desta página específica, atendendo ao novo requisito de restaurar a visibilidade total dos produtos na aba "Meus Cursos".