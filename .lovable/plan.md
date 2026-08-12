# Plano: Correção de Incorporação de Vídeos do Google Drive

O objetivo é garantir que vídeos do Google Drive configurados como públicos sejam reproduzidos corretamente na plataforma sem solicitar acesso, através da conversão automática do link de compartilhamento para o formato de visualização/incorporação (`preview`).

## Alterações

### Componentes e Lógica
1.  **`src/components/platform/VideoPlayer.tsx`**:
    *   Adicionar lógica para detectar URLs do Google Drive.
    *   Implementar a função `getGoogleDriveEmbedUrl` para transformar links `/file/d/ID/view` em `/file/d/ID/preview`.
    *   Garantir que o `iframe` use a URL convertida.

2.  **`src/routes/app.ebooks.$ebookId.tsx`**:
    *   Atualizar as expressões regulares e a lógica de renderização do vídeo de abertura (intro) e dos vídeos dos capítulos para suportar a conversão de links do Google Drive.

3.  **`src/routes/admin.ebooks.tsx` (Opcional, mas recomendado)**:
    *   Adicionar uma dica visual ou validação no campo de URL de vídeo para informar sobre a necessidade de permissão pública no Drive.

## Detalhes Técnicos
*   **Regex para ID do Drive**: `/\/file\/d\/([^\/]+)/` ou `id=([^&]+)`.
*   **Formato de Embed**: `https://drive.google.com/file/d/${fileId}/preview`.
*   **Atributos do Iframe**: Manter `allow="autoplay; fullscreen"` para melhor experiência.

## Validação
*   Testar com um link real de teste do Google Drive (se disponível) ou simular a conversão.
*   Verificar se vídeos do YouTube continuam funcionando normalmente.
