# Plano de Implementação: Gestão Dinâmica de Planilhas e Materiais

O objetivo é transformar a seção de "Planilhas e Materiais" (atualmente baseada em geradores de código estáticos e dados fixos no frontend) em um sistema dinâmico gerenciado pelo painel administrativo. Isso permitirá que o administrador faça upload de novos arquivos Excel/PDF, renomeie materiais e adicione novos itens sem alterar o código.

## Alterações de Banco de Dados

1. **Criar tabela `platform_materials`**:
   - `id`: uuid (primary key)
   - `title`: text (not null)
   - `description`: text
   - `type`: text (XLSX, PDF, CANVA, ZIP, etc.)
   - `file_url`: text (URL do arquivo no Supabase Storage)
   - `external_url`: text (para links como Canva)
   - `category`: text
   - `is_active`: boolean (default true)
   - `created_at`: timestamp with time zone
   - `updated_at`: timestamp with time zone

2. **Configurar Supabase Storage**:
   - Criar bucket `platform-materials` (público para leitura, restrito para escrita via admin).

3. **Políticas de RLS**:
   - `SELECT`: Permitido para todos os usuários autenticados (`authenticated`).
   - `INSERT/UPDATE/DELETE`: Permitido apenas para usuários com role `admin` ou `manager`.

## Alterações de Backend (Server Functions)

1. **Criar `src/lib/materials.functions.ts`**:
   - `getMaterials`: Busca todos os materiais ativos.
   - `upsertMaterial`: Cria ou atualiza um material (admin).
   - `deleteMaterial`: Remove um material e seu arquivo associado (admin).

## Alterações de Frontend

### Painel Administrativo
1. **Criar `src/routes/admin.materiais.tsx`**:
   - Interface de listagem com busca e filtros.
   - Botão para "Novo Material".
   - Modal/Formulário para:
     - Nome do material.
     - Descrição.
     - Tipo (Excel, PDF, Link Externo).
     - Upload de arquivo (usando componente `ImageUpload` adaptado para documentos ou similar).
     - Edição de campos existentes.

2. **Atualizar `src/routes/admin.index.tsx`**:
   - Adicionar atalho para "Gestão de Materiais".

### Área de Membros
1. **Refatorar `src/routes/app.materiais.tsx`**:
   - Substituir o uso de `materials` estático do `platform-data.ts` por uma consulta ao banco de dados via TanStack Query.
   - Manter a lógica de fallback para os geradores automáticos (`materials-generator.ts`) caso o material não tenha um `file_url` definido, garantindo retrocompatibilidade.
   - Atualizar o botão de download para priorizar o `file_url` do banco.

## Detalhes Técnicos
- Utilização de `supabase.storage` para gerenciamento físico dos arquivos.
- Sincronização automática: alterações no admin refletem instantaneamente no app através do cache do TanStack Query.
- Validação de arquivos: permitir apenas extensões seguras (.xlsx, .pdf, .zip).

## User Questions
- Gostaria que os materiais atuais (estáticos) fossem migrados automaticamente para o banco de dados na primeira execução ou prefere cadastrá-los manualmente?
