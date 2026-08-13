# Plano de Migração do Vídeo de Introdução para Supabase Storage

O objetivo é migrar o vídeo de introdução do e-book (atualmente no Google Drive) para o Supabase Storage, garantindo uma reprodução estável via HTML5 em dispositivos móveis e desktop, sem depender de links externos instáveis.

## Auditoria e Diagnóstico
- **E-book ID:** `ee1a776c-6c7d-4a88-a980-7e671ad8d4fb`
- **URL Atual:** `https://drive.google.com/file/d/1OK2BVmkpimOaW8X5q_nS_auUQxcsxH6c/view?usp=sharing` (hospedada no Google Drive).
- **Componente:** `src/components/platform/VideoPlayer.tsx` tenta converter URLs do Drive para o formato `/preview` do iframe, o que causa falhas de carregamento e interação no mobile.
- **Armazenamento Existente:** Já existem os buckets `content-covers` e `course-assets` (privados).

## Mudanças Técnicas

### 1. Preparação do Armazenamento
- O bucket `course-assets` será utilizado para o vídeo.
- Como o bucket é privado, implementaremos a geração de **Signed URLs** para acesso seguro e temporário.

### 2. Backend (Supabase)
- Criar uma migração para permitir que usuários autenticados (alunos matriculados) possam ler os arquivos do bucket `course-assets` via políticas de RLS.
- Garantir que a `service_role` tenha acesso total para que o servidor possa gerar as Signed URLs.

### 3. Frontend / API
- Criar uma Server Function `getSignedVideoUrl` para gerar a URL assinada de forma segura no lado do servidor.
- Atualizar o componente `EbookReaderPage` (`src/routes/app.ebooks.$ebookId.tsx`) para:
    - Identificar se a URL é do Storage (não é YouTube/Drive).
    - Buscar a URL assinada antes de renderizar o player.
- Atualizar o `VideoPlayer` para tratar URLs diretas com as tags `<video>` HTML5 corretas (`playsInline`, `preload="metadata"`, etc.).

### 4. Admin
- Atualizar o componente `VideoUpload` para garantir que o upload de vídeos de abertura vá para o bucket correto e salve a URL pública (que será assinada no consumo).

## Processo de Execução
1. Executar migração de RLS para o bucket.
2. Criar a Server Function de assinatura de URL.
3. Ajustar o `VideoPlayer.tsx` para suporte robusto a HTML5.
4. Ajustar `app.ebooks.$ebookId.tsx` para carregar URLs assinadas.
5. (Ação do Usuário): Após a estrutura pronta, o usuário deverá fazer o upload do arquivo MP4 original via painel administrativo ou fornecer o arquivo para upload.

## Verificação
- Testar no Desktop (Chrome).
- Testar no Mobile (Safari/iOS e Chrome/Android) simulando a interação do usuário.
- Validar se o player HTML5 carrega os metadados e responde ao Play sem buffering excessivo.
