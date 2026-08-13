# Plano de Correção: Erro "Bucket not found" em Materiais

Este plano visa corrigir o erro de acesso aos materiais da plataforma, onde os alunos encontram o erro "Bucket not found" (NoSuchBucket) ao tentar baixar arquivos PDF ou planilhas.

## Análise do Problema
*   **Causa Raiz**: O bucket `platform-materials` no Supabase está configurado como **privado** (`public: false`), mas o sistema está gerando URLs públicas (`/storage/v1/object/public/...`). Quando o endpoint público do Supabase tenta acessar um bucket privado, ele retorna um erro 404/NoSuchBucket.
*   **Verificação**: Confirmamos que o bucket existe, o arquivo `p14hjpommfh.pdf` está presente, mas o acesso público está negado pela configuração do bucket.

## Ações Propostas

### 1. Banco de Dados (Supabase Storage)
*   Alterar a configuração do bucket `platform-materials` para **público**.
*   Configurar políticas de RLS (Row-Level Security) no bucket para garantir que:
    *   Qualquer pessoa (público) possa ler os materiais (necessário para os links diretos funcionarem).
    *   Apenas administradores possam fazer upload, atualizar ou excluir arquivos.

### 2. Infraestrutura
*   Executar uma migração SQL para aplicar essas alterações de forma permanente e segura.

## Detalhes Técnicos
*   **Comando SQL**: `UPDATE storage.buckets SET public = true WHERE id = 'platform-materials';`
*   **Políticas de RLS**:
    *   `CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'platform-materials');`
    *   `CREATE POLICY "Admin CRUD" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'platform-materials' AND public.has_role(auth.uid(), 'admin'));`

## Validação
*   Testar o link de download direto: `https://jpapgdwrjjvhmniqtukg.supabase.co/storage/v1/object/public/platform-materials/p14hjpommfh.pdf`
*   Verificar na interface de administração se o upload de novos materiais continua funcionando.
*   Confirmar que alunos conseguem baixar materiais sem erros na página `/app/materiais`.
