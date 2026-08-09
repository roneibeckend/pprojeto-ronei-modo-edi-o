# Plano de Implementação: E-book "50 Receitas de Espetinhos"

Este plano detalha a criação de um e-book digital completo com 50 receitas de espetinhos, organizado em módulos e capítulos, integrado ao sistema existente.

## 1. Estrutura de Dados (Supabase)
As tabelas necessárias já existem (`ebooks`, `ebook_modules`, `ebook_chapters`). Usaremos uma migração para popular os dados.

- **E-book Principal**: "50 Receitas de Espetinhos: O Guia Completo".
- **Módulos Sugeridos**:
  1. Carnes Nobres (Boi e Cordeiro)
  2. Aves e Suínos
  3. Frutos do Mar
  4. Vegetarianos e Veganos
  5. Acompanhamentos e Molhos Especiais
  6. Dicas de Mestre (Brasa, Tempero e Venda)

## 2. Conteúdo do E-book
Cada receita será um `ebook_chapter` com:
- **Título**: Nome da Receita.
- **Minutos de Leitura**: Calculado com base no texto.
- **Conteúdo**: HTML estruturado com `<h3>Ingredientes</h3>`, `<ul>`, `<h3>Modo de Preparo</h3>`, `<ol>`, e `<blockquote>Dica do Chef</blockquote>`.

## 3. Implementação Técnica

### A. Migração de Dados
Criar uma nova migração para:
1. Inserir o registro na tabela `ebooks`.
2. Inserir os 6 módulos na tabela `ebook_modules`.
3. Inserir as 50 receitas distribuídas nos módulos na tabela `ebook_chapters`.

### B. Ajustes na Interface
- O e-book aparecerá automaticamente na vitrine unificada em `/app`.
- O leitor em `/app/ebooks/$id` permitirá a navegação sequencial e por índice.

### C. Visual Text Edit
- Aplicar a correção no elemento `span.hidden` na página inicial conforme solicitado.

## 4. Validação
- Acessar a área do aluno (`/app`).
- Verificar se o e-book aparece na vitrine.
- Entrar no leitor e navegar pelos módulos e receitas.
- Confirmar se a formatação HTML das receitas está legível.
