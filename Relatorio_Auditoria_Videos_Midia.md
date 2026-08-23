# Auditoria e Otimização de Vídeos e Mídia (Landing + /app)

Data: 23/08/2026

## 1. Vídeos encontrados

| Local | Arquivo | Antes | Depois |
|---|---|---|---|
| Landing (modal "história do Ronnei") | ronnei-historia.mp4 (CDN) | 39,7 MB · 720x1280 · 1,77 Mbps | Desktop 14,9 MB (720x1280 · 620 kbps) + Mobile 11,5 MB (480x854 · 480 kbps) |
| /app e-book "Do zero aos 10K" (abertura) | course-assets/videos/intro-optimized-mobile.mp4 | 13,7 MB | mantido (dentro da meta 10–30 MB) |
| /app capítulos | YouTube (3 itens) | embed | iframe só após o play (lazy) |
| Storage órfãos | course-assets/07e16aba…mp4 e 7d2dc488…mp4 | 47,8 MB cada | não referenciados (candidatos a exclusão) |
| Storage extra | course-assets/07c7cf6f…mp4 | 15,0 MB | não referenciado |

## 2. Problemas identificados

1. Vídeo da landing 2,6x acima da meta (39,7 MB) → buffering e travamento no 3G/4G.
2. Uma única versão para todos os dispositivos: celular baixava o arquivo de desktop.
3. Poster genérico (foto do autor) → salto visual/tela preta ao iniciar.
4. Sem liberação de recursos ao fechar o modal / trocar de capítulo → buffer preso na memória (iOS).
5. Queda de conexão deixava o player parado para sempre, sem retomada.
6. `localStorage` gravado a cada `timeupdate` (~4x/s) → CPU e I/O desnecessários.
7. Picture-in-Picture bloqueado por `disablePictureInPicture`.
8. Cache curto: uploads de mídia com `max-age=3600` e proxy do Drive com 1h → downloads repetidos.
9. Capítulo "Frango com Bacon na Prática" aponta para `ebook-assets/videos/a6eec803….mp4`, arquivo inexistente no Storage (vídeo quebrado — precisa reenvio).

## 3. Correções aplicadas

- Recompressão H.264 (yuv420p, faststart, AAC) em duas trilhas: mobile e desktop.
- `VideoPlayer` escolhe a trilha por tela (<= 820px), `saveData` e `effectiveType` (2g/3g).
- Poster real extraído do próprio vídeo (84 KB) — sem tela preta.
- `preload="none"` + `<video>`/iframe só carregam após o toque no play (lazy + progressivo por Range).
- Limpeza no unmount: `pause()` + remoção do `src` + `load()` → libera decoder/memória.
- Auto-recovery: `stalled`/`error` e evento `online` retomam do ponto exato (até 3 tentativas).
- Progresso salvo no máximo a cada 5s (antes: a cada frame de `timeupdate`).
- Picture-in-Picture liberado; `playsInline`, `webkit-playsinline`, fullscreen e controles nativos únicos mantidos.
- Cache: uploads de vídeo/imagem com `cacheControl: 31536000`; proxy do Drive `max-age=86400, immutable`.
- Signed URLs de 6h reaproveitadas por sessão (sem downloads duplicados).

## 4. Ganhos

- Landing mobile: 39,7 MB → 11,5 MB (**-71%**); desktop → 14,9 MB (**-62%**).
- Bytes antes do play: 0 (lazy confirmado em teste automatizado iPhone 393x852).
- Memória: buffer liberado ao fechar modal/trocar capítulo (antes permanecia).
- Tempo até o play: início por streaming progressivo com moov no início (faststart).
- Escritas em disco/CPU do player reduzidas ~95%.

## 5. Pendências recomendadas

1. Reenviar o vídeo do capítulo "Frango com Bacon na Prática" (arquivo ausente no Storage).
2. Excluir os 3 vídeos órfãos no bucket `course-assets` (~110 MB de storage).
3. Objetos já enviados mantêm `max-age=3600`; o cache longo vale para novos uploads.
