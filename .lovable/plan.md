# Plano: Suporte a Upload de Arquivos .pdf e .docx

Este plano descreve as alterações necessárias para permitir o upload e o processamento de arquivos Microsoft Word (.docx), além do suporte já existente para PDF, na funcionalidade de importação de e-books.

## Alterações

### 1. Backend (Server Functions)
- **Instalação de Dependência**: Adicionar a biblioteca `mammoth` para extração de texto de arquivos DOCX (já realizado no estágio de exploração).
- **Refatoração de `src/lib/ebook-import.functions.ts`**:
    - Renomear `importEbookFromPdf` para `importEbookFromFile` para refletir o suporte multimídia.
    - Implementar lógica de detecção de formato baseada na assinatura do arquivo ou MIME type.
    - Adicionar função `processDocxContent` usando `mammoth` para converter Word em HTML/Texto.
    - Manter a lógica de segmentação em capítulos/seções para ambos os formatos.

### 2. Frontend (Interface Administrativa)
- **Atualização em `src/routes/admin.ebooks.tsx`**:
    - Alterar o atributo `accept` do input de arquivo de `.pdf` para `.pdf,.docx`.
    - Atualizar a função `handleImportPdf` (renomear para `handleImportFile`) para lidar com as novas extensões.
    - Ajustar mensagens de erro e toasts para incluir referências a arquivos Word.
    - Garantir que o ícone de upload e dicas de ferramenta reflitam os novos formatos suportados.

## Detalhes Técnicos
- **MIME Types Suportados**: 
    - PDF: `application/pdf`
    - DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Biblioteca de Processamento**: `mammoth` é preferida para DOCX por gerar HTML semântico e limpo, ideal para a estrutura de capítulos do e-book.
- **Limite de Tamanho**: O limite de 60MB será mantido para garantir a estabilidade da infraestrutura de processamento.
