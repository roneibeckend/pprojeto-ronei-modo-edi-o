# Plano de Correção: Reprodução de Vídeo em Dispositivos Móveis

O objetivo é eliminar a "tela preta" e garantir que os vídeos iniciem corretamente em dispositivos móveis após a interação do usuário, abordando as restrições de autoplay e codecs dos navegadores móveis (Safari, Chrome).

## Problemas Identificados
1. **Conflito de Autoplay Mudo vs. Som:** Dispositivos móveis bloqueiam vídeos com som que tentam iniciar automaticamente ou via scripts que o navegador não reconhece como originados por um gesto do usuário.
2. **Race Conditions no Carregamento:** O player tenta reproduzir antes que os metadados ou o buffer inicial estejam prontos, resultando em erro silencioso ou tela preta.
3. **Gestão de Iframe (Google Drive):** O redimensionamento (scale) e overlays podem estar bloqueando o clique real que o iframe precisa para iniciar no mobile.
4. **Resiliência do Player Nativo:** Falta de tratamento robusto para o erro `NotAllowedError` (bloqueio de autoplay).

## Ações Técnicas

### 1. Refatoração do `VideoPlayer.tsx`
- **Estratégia "Gesto Primeiro":** Garantir que qualquer chamada `.play()` esteja estritamente vinculada a um evento síncrono de `onClick` ou `onTouchEnd`.
- **Tratamento de Erros Robusto:** Adicionar um bloco `try/catch` em todas as chamadas de play, com fallback automático para modo mudo (`muted = true`) caso o play com som seja negado.
- **Sincronização de Atributos:** Forçar explicitamente `playsinline`, `webkit-playsinline` e `muted` via DOM API (além das props do React) para garantir compatibilidade com Safari/iOS.
- **Feedback Visual:** Melhorar o estado de "loading" para que o spinner só suma quando o vídeo realmente emitir o evento `playing`.

### 2. Refatoração do `StoryPlayer.tsx`
- Aplicar a mesma lógica de resiliência: se o play falhar, tentar novamente em modo mudo.
- Garantir que o overlay de "Toque para ativar o som" apareça apenas se o vídeo estiver rodando em mudo.

### 3. Ajustes na Landing Page (`index.tsx`)
- **Limpeza de Overlay:** Reduzir a opacidade/presença do overlay de interação em dispositivos móveis para garantir que o primeiro toque chegue ao iframe do Google Drive, se for o caso.
- **Parâmetros de Iframe:** Otimizar as strings de consulta do Drive para `autoplay=1&mute=1` (mudo por padrão para garantir que inicie).

### 4. Correção em Rotas de Curso/Ebook
- Garantir que o `VideoPlayer` receba a URL assinada corretamente e que o componente seja remontado (`key={signedUrl}`) para evitar que o player segure um estado de erro da URL anterior.

## Validação
- Testar via emulação de dispositivos móveis no Playwright.
- Verificar logs de console para capturar `NotAllowedError` ou `AbortError` durante a reprodução.
- Confirmar visualmente que não há tela preta após o clique.
