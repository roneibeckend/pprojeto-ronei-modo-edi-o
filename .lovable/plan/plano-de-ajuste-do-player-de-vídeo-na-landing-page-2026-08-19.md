# Plano de Ajuste do Player de Vídeo na Landing Page

O objetivo deste plano é garantir que o player de vídeo na página inicial seja exibido em um tamanho adequado e que o botão de fechar ("X") esteja sempre visível e acessível em qualquer dispositivo.

## Problemas Identificados
- O player 9:16 pode ultrapassar a altura da tela em dispositivos menores.
- O botão de fechar está posicionado fora do container do vídeo (`-top-14`), o que pode fazê-lo sumir da tela se o vídeo for muito grande.

## Alterações Propostas

### 1. Dimensionamento do Player
- Ajustar o container do vídeo em `src/routes/index.tsx` para ter uma altura máxima de `85vh`.
- Garantir que a largura se ajuste proporcionalmente ao aspecto 9:16.

### 2. Acessibilidade do Botão de Fechar
- Mover o botão de fechar para dentro da área visível do modal ou container.
- Aumentar o contraste e o tamanho da área de clique para facilitar o uso em dispositivos móveis.

## Detalhes Técnicos

### Arquivos a serem modificados:
- `src/routes/index.tsx`: Modificar a seção do Modal de Vídeo dentro da função `Hero`.

### Exemplo de implementação no JSX:
```tsx
<div className="relative w-full max-w-[min(420px,85vh*9/16)] max-h-[85vh] animate-scale-in mx-auto">
  <button
    onClick={() => setVideoOpen(false)}
    className="absolute -top-12 right-0 sm:-right-4 z-[110] ..."
  >
    <X className="h-6 w-6" />
  </button>
  {/* Video container with max-h-[85vh] */}
</div>
```

## Verificação
- Testar a abertura do vídeo em diferentes viewports (Mobile, Tablet, Desktop).
- Confirmar que o botão "X" é clicável e fecha o vídeo instantaneamente.
