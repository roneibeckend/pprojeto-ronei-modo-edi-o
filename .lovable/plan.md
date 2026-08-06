# Plano de Implementação: Precificação e Upload de Vídeos em Cursos

Este plano detalha a adição de campos de preço para cursos e a funcionalidade de upload de vídeo para aulas na área administrativa.

## Alterações no Banco de Dados

1.  **Tabela `courses`**: Já possui a coluna `price`, mas garantiremos que a interface a utilize corretamente.
2.  **Tabela `course_lessons`**: Já possui a coluna `video_url`.
3.  **Storage**: Garantir a existência de um bucket para vídeos (ex: `course-videos`), caso não exista.

## Alterações no Frontend

### 1. Gestão de Preço (Informações do Curso)
*   **Arquivo**: `src/routes/admin.cursos.tsx`
*   **Ação**: Adicionar um campo numérico para "Preço (R$)" na aba "Informações" do modal de edição de curso.
*   **Lógica**: Atualizar o estado `editingItem` e garantir que o valor seja persistido no Supabase via `upsert`.

### 2. Upload de Vídeos (Conteúdo das Aulas)
*   **Componente**: Criar ou adaptar `src/components/admin/VideoUpload.tsx` (baseado no `ImageUpload.tsx` existente) para lidar com arquivos MP4/MOV.
*   **Arquivo**: `src/components/admin/CourseTreeEditor.tsx`
*   **Ação**: Substituir o campo de texto "URL do Vídeo" no modal de aula pelo novo componente `VideoUpload`.
*   **Lógica**: Fazer o upload do arquivo para o bucket do Supabase e salvar a URL pública no campo `video_url` da aula.

## Verificação
*   Validar se o preço é salvo e exibido corretamente.
*   Testar o upload de um vídeo curto e verificar se a URL é gerada e salva na aula.
