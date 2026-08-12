---
name: Atualização do E-book "Do zero aos 10K"
description: Atualizar o conteúdo do e-book existente a partir de um arquivo DOCX preservando acessos e estrutura.
type: feature
---

## Objetivos
Atualizar integralmente o conteúdo do e-book "Do zero aos 10K" (ID: `ee1a776c-6c7d-4a88-a980-7e671ad8d4fb`) utilizando o arquivo DOCX fornecido, sem alterar a estrutura do banco de dados e mantendo todos os acessos de alunos e progresso existentes.

## Etapas de Implementação

### 1. Preparação e Backup Logístico
- Identificar o registro atual e seus capítulos existentes.
- Criar um script de migração/ajuste temporário para processar o DOCX.

### 2. Processamento do Conteúdo (DOCX)
- Utilizar a biblioteca `mammoth` (já integrada em `src/lib/ebook-import.functions.ts`) para converter o DOCX em HTML.
- Refinar a extração para capturar toda a estrutura (títulos, capítulos, subtítulos, listas, boxes de cálculos e checklists) conforme solicitado.
- Garantir que nenhum conteúdo seja resumido ou descartado.

### 3. Atualização do Banco de Dados (Preservação de Dados)
- **E-book**: Manter o registro `ee1a776c-6c7d-4a88-a980-7e671ad8d4fb`.
- **Módulos/Capítulos**: 
    - Remover capítulos existentes *somente após* garantir a nova estrutura.
    - Como o progresso (`ebook_progress`) está atrelado ao `chapter_id`, tentaremos mapear capítulos antigos para novos se possível, ou documentar que o progresso será reiniciado se a estrutura mudar drasticamente (embora o requisito peça preservação, a mudança completa de conteúdo geralmente invalida o progresso por ID).
    - **Estratégia de Preservação**: Se o e-book atual tem apenas 1 capítulo (conforme auditado), a substituição é direta. Se houvesse muitos, tentaríamos manter IDs.

### 4. Implementação Técnica
- Criar uma nova função de servidor `src/lib/ebook-update-official.functions.ts` dedicada a esta atualização única e oficial.
- Esta função lerá o arquivo em `/mnt/user-uploads/Espetinho_na_Veia_Importacao_Lovable_Leve.docx`.
- Inserir os novos módulos e capítulos vinculados ao ID existente.

### 5. Validação
- Verificar contagem de capítulos (Antes: 1 | Depois: N).
- Validar acesso do administrador e alunos.
- Testar visualização mobile e desktop.

## Detalhes Técnicos
- **ID do E-book**: `ee1a776c-6c7d-4a88-a980-7e671ad8d4fb`.
- **Ferramentas**: `mammoth` para DOCX, `supabaseAdmin` para bypass de RLS durante a atualização estrutural.
- **Segurança**: Operação restrita ao escopo do e-book alvo.
