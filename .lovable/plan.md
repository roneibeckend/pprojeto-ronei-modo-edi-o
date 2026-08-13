# Plano de Auditoria e Correção: Vídeo de Introdução Mobile

O objetivo é diagnosticar e resolver a interrupção da reprodução do vídeo de introdução em dispositivos móveis, realizando uma auditoria técnica completa e implementando uma versão otimizada e um player resiliente.

## Auditoria Técnica Realizada
- **Codec Original**: H.264 / AVC (High Profile @ Level 4.1).
- **Áudio**: AAC LC, Stereo, 44.1kHz.
- **Container**: MP4 com `moov atom` no início (Fast Start).
- **Servidor**: Supabase Storage (Cloudflare CDN).
- **Protocolo**: Suporte a Range Requests (HTTP 206) confirmado.
- **Bitrate**: ~4 Mbps (Considerado alto para algumas conexões móveis).

## Ações Propostas

### 1. Disponibilização de Mídia Otimizada
- Já geramos e enviamos uma versão "Mobile Safe":
  - **Codec**: H.264 (Main Profile @ Level 4.0) para máxima compatibilidade.
  - **Áudio**: Removido completamente (`-an`) para eliminar restrições de autoplay.
  - **Otimização**: Forçado `+faststart` e bitrate controlado.
  - **Local**: `course-assets/videos/intro-optimized-mobile.mp4`.

### 2. Atualização da Base de Dados
- Atualizaremos o e-book "Do zero aos 10K" para utilizar esta nova URL otimizada, permitindo a validação imediata no ambiente real.

### 3. Refatoração do Componente `VideoPlayer.tsx`
- **Telemetria**: Implementação de logs detalhados para todos os eventos de mídia (`stalled`, `suspend`, `waiting`, etc.).
- **Robustez de Autoplay**:
  - Garantir `muted` e `defaultMuted` via propriedade direta do elemento DOM antes do `play()`.
  - Capturar e logar explicitamente a Promise retornada por `play()`.
  - Alterar `preload` para `auto` especificamente para vídeos de intro.
- **Tratamento de Erros**: Exibir logs claros no console sobre falhas de codec ou interrupção de rede.

### 4. Verificação de Rede
- Validar via script que o novo arquivo entrega o `Content-Type: video/mp4` correto.
