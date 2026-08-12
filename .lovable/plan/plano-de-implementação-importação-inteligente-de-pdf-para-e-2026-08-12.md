# Plano de Implementação: Importação Inteligente de PDF para E-books

Este plano detalha a implementação da funcionalidade de importação de arquivos PDF, com processamento inteligente de conteúdo para estruturar automaticamente capítulos e módulos, garantindo uma organização consistente.

## Alterações Propostas

### Backend (Server Functions)
- **Novo arquivo `src/lib/ebook-import.functions.ts`**:
    - Utilização da biblioteca `pdf-parse` para extração de texto de arquivos PDF.
    - Lógica de segmentação inteligente baseada em padrões estruturais (ex: regex para detectar capítulos, módulos e títulos em caixa alta).
    - Conversão de quebras de linha em tags HTML `<br />` para preservar a formatação básica.
    - Inserção automática de um módulo de "Conteúdo Importado" e múltiplos capítulos no banco de dados Supabase.

### Frontend (Painel Administrativo)
- **Atualização em `src/routes/admin.ebooks.tsx`**:
    - Adição de um botão de upload de arquivo no `EbookContentEditor`.
    - Implementação de estados de carregamento (`isImporting`) para fornecer feedback visual durante o processamento do PDF.
    - Integração com a nova `server function` para processar o arquivo assim que selecionado.
    - Exibição de mensagens de sucesso (toast) informando a quantidade de capítulos criados.

## Detalhes Técnicos
- **Biblioteca**: `pdf-parse` (instalada via `bun add`).
- **Padrão de Segmentação**: `\n(?=(?:CAPÍTULO|MÓDULO|PARTE|CHAPTER|MODULE|SECTION)\s+\d+|[A-Z\s]{10,}\n\n)` - Este padrão identifica inícios de seções baseados em palavras-chave ou títulos longos em caixa alta.
- **Segurança**: Operações de banco de dados protegidas via RLS no Supabase.

## Verificação e Testes
1. Acessar o Painel Admin -> E-books.
2. Editar um e-book existente ou criar um novo.
3. Ir para a aba "Capítulos".
4. Clicar no ícone de "Upload" (FileUp) ao lado de "Estrutura de Conteúdo".
5. Selecionar um PDF estruturado.
6. Verificar se os capítulos foram criados e o conteúdo segmentado corretamente.
