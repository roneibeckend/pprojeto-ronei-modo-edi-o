# Plano de Correção: Reprodução Robusta de Vídeos MP4 em Mobile

Este plano visa resolver problemas de carregamento e reprodução de vídeos MP4 em dispositivos móveis (Chrome Android, Safari iOS), mantendo as proteções de segurança e autenticação estabelecidas no Lote 1.

## Problema
Vídeos MP4 hospedados no Supabase Storage apresentam falhas em dispositivos móveis, ficando travados ou não iniciando o carregamento devido a restrições de autoplay, falta de tratamento de erros de rede e ausência de otimizações específicas para o ciclo de vida do elemento de vídeo em navegadores móveis.

## Alterações Técnicas

### 1. Refatoração do `VideoPlayer.tsx`
*   **Gestão de Ciclo de Vida**: Implementar limpeza agressiva de recursos do elemento `<video>` no unmount para evitar vazamentos de memória e bloqueios de codec.
*   **Tratamento de Erros Móveis**: Capturar e tratar especificamente `NotAllowedError` (bloqueio de autoplay) e `AbortError` (conflito de carregamento).
*   **Otimização de Carregamento**: Ajustar o `preload` dinamicamente e remover o atributo `src` antes de destruir o elemento.
*   **Feedback de UI**: Melhorar o estado de carregamento e erro para ser amigável ao toque e visualmente claro sobre o que o usuário deve fazer (ex: "Toque para reproduzir").
*   **Segurança**: Manter a derivação de bucket/path no servidor e o uso de URLs assinadas.

### 2. Refatoração do `StoryPlayer.tsx`
*   **Compatibilidade Mobile**: Adicionar `playsInline` e tratamento de erros semelhante ao `VideoPlayer`.
*   **Controles de Toque**: Garantir que as interações de toque não conflitem com as políticas do navegador.
*   **Autoplay**: Implementar lógica de fallback para início manual se o autoplay silenciado falhar.

### 3. Ajustes na Landing Page (`index.tsx`)
*   **Hero Video**: Garantir que se algum vídeo MP4 for usado no futuro na Hero, ele siga os mesmos padrões de robustez. No momento, o vídeo da Hero é YouTube, que já é resiliente, mas os componentes de slideshow serão verificados.

## Detalhes de Segurança (Lote 1 Preservado)
*   Nenhuma alteração nos validadores do Zod que removeram `path` e `bucket` do input do cliente.
*   A resolução de URLs continua sendo feita via `supabaseAdmin` no servidor.
*   As verificações de matrícula (enrollment) permanecem obrigatórias para acesso a vídeos protegidos.
*   A atomicidade dos webhooks do Asaas não será afetada.

## Verificação
*   Execução de `npm run build` para garantir integridade do tipo.
*   Inspeção estática do código para confirmar que as correções de segurança não foram revertidas.
