# Plano de Correção: Visibilidade do eBook "Do zero aos 10K"

O objetivo é garantir que o novo eBook "Do zero aos 10K" esteja visível para administradores e alunos, corrigindo falhas na estrutura de dados e garantindo as permissões necessárias.

## Problemas Identificados
1. **Estrutura Incompleta**: O eBook foi criado na tabela `ebooks`, mas não possui registros relacionados nas tabelas `ebook_modules` e `ebook_chapters`. A interface de leitura (`app.ebooks.$ebookId.tsx`) falha ao carregar se não houver capítulos.
2. **Filtro de Exibição**: A vitrine principal (`app.index.tsx`) filtra itens com `is_locked: false`. Precisamos garantir que este status esteja correto.
3. **Liberação de Acesso**: Para alunos (incluindo o admin quando em visão de aluno), o eBook só aparece se houver um registro em `ebook_enrollments` ou se o preço for zero.

## Ações Propostas

### 1. Correção na Estrutura do Banco de Dados
Executar um script de servidor para:
- Garantir que o eBook `ee1a776c-6c7d-4a88-a980-7e671ad8d4fb` esteja com `is_locked: false`.
- Criar um módulo padrão ("Conteúdo Principal") se não existir.
- Criar um capítulo inicial ("Introdução") se não existir, para permitir a renderização da página.
- Vincular o usuário administrador ao eBook na tabela `ebook_enrollments`.

### 2. Melhoria na Interface do Aluno (`app.cursos.index.tsx`)
- Adicionar tratamento para eBooks que podem estar sem módulos/capítulos ainda, exibindo um estado amigável em vez de sumir da lista ou causar erro de carregamento.

### 3. Verificação de RLS (Row Level Security)
- Confirmar que as políticas de SELECT permitem que usuários autenticados visualizem os registros básicos do eBook.

## Detalhes Técnicos
- Utilização de `supabaseAdmin` para realizar as correções de dados que exigem bypass de RLS ou permissões elevadas.
- O script será executado via `bun run` no ambiente de sandbox.
- Validação através de consulta direta ao banco após a execução.
