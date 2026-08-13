# Plano de Implementação: Gestão Dinâmica de Planilhas e Materiais

O objetivo é transformar a seção de "Planilhas e Materiais" em um sistema dinâmico gerenciado pelo administrador. Isso permitirá upload de novos arquivos Excel/PDF, renomeação de materiais e adição de novos itens sem alterar o código.

## Alterações de Banco de Dados

1. **Criar tabela `platform_materials`**:
   - `id`: uuid (primary key)
   - `title`: text (not null)
   - `description`: text
   - `type`: text (XLSX, PDF, CANVA, ZIP, etc.)
   - `file_url`: text (URL do arquivo no Supabase Storage)
   - `external_url`: text (para links externos como Canva)
   - `category`: text
   - `is_active`: boolean (default true)
   - `created_at`: timestamp with time zone
   - `updated_at`: timestamp with time zone

2. **Configurar Supabase Storage**:
   - Criar bucket `platform-materials` (público para leitura, restrito para escrita via admin).

3. **Políticas de RLS**:
   - `SELECT`: Permitido para todos os usuários autenticados.
   - `INSERT/UPDATE/DELETE`: Permitido apenas para administradores.

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
   - Formulário para: Nome, Descrição, Tipo (Excel, PDF, Link Externo) e Upload de arquivo.

### Área de Membros
1. **Refatorar `src/routes/app.materiais.tsx`**:
   - Substituir o uso de dados estáticos por consulta ao banco de dados via TanStack Query.
   - Manter a lógica de fallback para os geradores automáticos atuais para garantir que nada pare de funcionar.

## Detalhes Técnicos
- Utilização de `supabase.storage` para gerenciamento dos arquivos.
- Sincronização automática via cache do TanStack Query.

## Perguntas
- Gostaria que os materiais atuais fossem migrados automaticamente para o banco de dados ou prefere cadastrá-los manualmente?
