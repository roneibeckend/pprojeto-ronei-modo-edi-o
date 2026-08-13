# Plano de Otimização e Correção de Vídeos

Este plano visa resolver o carregamento lento de vídeos e os erros específicos em dispositivos móveis.

## Problemas Identificados
1. **Latência de Inicialização**: O tempo para começar a reproduzir vídeos MP4 grandes pode ser alto, especialmente em conexões móveis.
2. **Restrições Mobile**: Navegadores móveis (Safari/Chrome no iOS/Android) têm políticas rígidas de reprodução automática e manipulação de buffers.
3. **Buffering Ineficiente**: O player atual pode estar tentando carregar o vídeo inteiro ou falhando ao lidar com interrupções de rede.

## Alterações Técnicas

### 1. Otimização do Componente VideoPlayer
- **Melhoria no Gerenciamento de Buffering**: Implementar lógica para detectar vídeos "travados" e forçar o re-carregamento do buffer.
- **Atributos Mobile**: Garantir que `playsInline`, `muted` e `controlsList="nodownload"` estejam configurados corretamente para evitar conflitos com players nativos de sistema.
- **Preload Inteligente**: Ajustar o atributo `preload` para `metadata` ou `auto` dependendo do contexto (intro vs aula) para economizar dados no mobile enquanto mantém a velocidade.

### 2. Melhoria na Estratégia de Rede
- **Pre-signing de URLs**: Otimizar as rotas de E-books e Cursos para gerar URLs assinadas em lote ou antecipadamente, reduzindo o tempo de espera antes do vídeo começar a carregar.
- **Link Preloading**: Refinar o uso de `<link rel="preload" as="video">` para carregar o próximo capítulo de forma mais agressiva em segundo plano.

### 3. Ajustes de UI/UX para Mobile
- **Controles Nativos vs Customizados**: Em dispositivos móveis, considerar habilitar controles nativos se os customizados causarem lentidão no render.
- **Feedback de Carregamento**: Melhorar o overlay de loading para ser mais responsivo à velocidade real de download.

## Plano de Implementação

1. **Atualizar `src/components/platform/VideoPlayer.tsx`**:
   - Adicionar tratamento de erro aprimorado para eventos `stalled` e `waiting`.
   - Implementar tentativa de auto-recuperação de buffer.
   - Otimizar renderização para evitar Layout Shifts.

2. **Refatorar `src/routes/app.ebooks.$ebookId.tsx` e `src/routes/app.cursos.$courseId.tsx`**:
   - Mudar a forma como as URLs assinadas são carregadas para evitar múltiplos re-renders.
   - Implementar lógica de pre-fetch mais robusta.

3. **Validação**:
   - Testar em ambiente mobile simulado e verificar logs de rede para garantir que os Range Requests estão funcionando corretamente.
