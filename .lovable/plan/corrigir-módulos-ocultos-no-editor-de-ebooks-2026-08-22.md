# Corrigir módulos ocultos no editor de eBooks

## Objetivo
Garantir que a árvore de módulos comece sempre pelo Módulo 1, continue navegável em qualquer altura suportada e não dependa do zoom do navegador.

## Implementação
- Remover o scroll vertical concorrente do contêiner externo da aba “Capítulos”.
- Fazer a aba e o editor ocuparem corretamente a altura disponível com `min-height: 0` e dimensões flexíveis.
- Manter um único scroll dedicado na lista de módulos e outro independente na área de edição, sem barras redundantes.
- Trocar o dimensionamento rígido do modal por limites baseados na área realmente disponível da viewport, preservando margens e o cabeçalho.
- Ajustar o layout responsivo da árvore e do editor para desktop, notebook e tablet, sem alterar a lógica de edição ou os dados.

## Validação
- Reproduzir e inspecionar a posição do Módulo 1 antes da correção.
- Confirmar ausência de sobreposição, clipping e scroll externo concorrente.
- Testar em 1366×768 e 1920×1080, além de notebook menor e tablet.
- Emular zoom de 80%, 90%, 100%, 110% e 125%, verificando que os módulos 1 e 2 permanecem acessíveis e que o último módulo também pode ser alcançado.
- Conferir erros de execução e o build após a alteração.

## Arquivos previstos
- `src/routes/admin.ebooks.tsx`
