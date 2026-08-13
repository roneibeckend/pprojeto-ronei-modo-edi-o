# Plano de Correção: Visualização do Perfil do Aluno (Admin)

Este plano visa corrigir e enriquecer a página de perfil do aluno no painel administrativo, garantindo que estatísticas de progresso e histórico de pagamentos sejam exibidos corretamente.

## Alterações Propostas

### 1. Refatoração da Busca de Dados (Backend/Queries)
- Atualizar a função `fetchStudentData` em `src/routes/admin.alunos.$studentId.tsx` para:
    - Buscar o histórico de pagamentos na tabela `payments` filtrando pelo `user_id` do aluno.
    - Contabilizar o progresso real em E-books consultando a tabela `ebook_progress`.
    - Calcular o "Total Investido" (`totalSpent`) somando os valores confirmados na tabela `payments`.

### 2. Interface do Usuário (Frontend)
- **Dashboard de Estatísticas**:
    - Garantir que os cards de "Aulas" e "Cursos" reflitam o estado real do banco de dados.
    - Adicionar a exibição do total financeiro investido pelo aluno.
- **Lista de Conteúdos**:
    - Exibir o progresso real dos e-books (baseado em capítulos lidos) em vez de um valor estático de 100%.
- **Nova Seção: Histórico Financeiro**:
    - Implementar uma nova seção "Histórico de Pagamentos" abaixo da atividade recente.
    - Exibir data, valor, método de pagamento (boleto, cartão, pix) e status (confirmado, pendente, estornado).
- **Tratamento de Estados**:
    - Melhorar as mensagens de carregamento e estados vazios para as novas seções.

## Detalhes Técnicos
- **Arquivo**: `src/routes/admin.alunos.$studentId.tsx`
- **Consultas Supabase**:
    - Adicionar `supabase.from('payments').select('*').eq('user_id', studentId)`
    - Adicionar `supabase.from('ebook_progress').select('chapter_id').eq('user_id', studentId)`
- **Componentes**:
    - Utilizar `ShoppingBag`, `CreditCard` e `CheckCircle2` da biblioteca Lucide para a nova seção financeira.

## Verificação
- Acessar o perfil de um aluno de teste com pagamentos realizados.
- Validar se o valor total e a lista de transações aparecem corretamente.
- Verificar se o progresso dos cursos e e-books condiz com a atividade real do usuário.
