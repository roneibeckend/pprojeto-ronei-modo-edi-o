# Plano de Remoção de Ícones Órfãos na Landing Page

Este plano visa remover ícones que permaneceram visíveis na landing page após a remoção de seus títulos correspondentes em etapas anteriores, garantindo a consistência visual da página.

## Alterações Propostas

### Frontend

- **Arquivo:** `src/routes/index.tsx`
- **Componente `SectionTag`:**
    - Modificar o componente para não renderizar o ícone `Flame` caso o conteúdo (`children`) seja apenas o caractere invisível `&#x2063;` (U+2063).
    - Isso removerá automaticamente os ícones de todas as seções onde os títulos foram "escondidos" anteriormente.
- **Componente `Objection`:**
    - Remover a chamada do componente `SectionTag` que está vazia/com caractere invisível (atualmente comentada ou com tag vazia, vou verificar a linha exata 1912).
- **Componente `Testimonials`:**
    - Remover ou ajustar o `SectionTag` na linha 1457 se o título correspondente for removido no futuro, mas por enquanto focar nos ícones órfãos atuais.

## Detalhes Técnicos

1.  **Refatoração do `SectionTag`**:
    ```tsx
    function SectionTag({ children }: { children: React.ReactNode }) {
      // Verifica se children é o marcador de "removido" (&#x2063; ou \u2063)
      const isHidden = children === "\u2063" || (typeof children === "string" && children.trim() === "");
      
      if (isHidden) return null;

      return (
        <span className="...">
          <Flame className="..." />
          {children}
        </span>
      );
    }
    ```
2.  **Limpeza de Tags residuais**:
    - Verificar ocorrências manuais de `SectionTag` que não foram tratadas pelo caractere invisível mas estão visualmente vazias.

## Verificação

- Acessar a landing page e confirmar que não existem ícones de chama (`Flame`) sozinhos no topo das seções.
- Confirmar que ícones em seções com títulos válidos (ex: "O problema", "Transformação") continuam visíveis.
