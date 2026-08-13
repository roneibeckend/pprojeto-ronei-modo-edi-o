# Plano: Correção de Feedback de Sucesso Prematuro e RLS em Materiais

Identifiquei que o sistema exibia uma mensagem de sucesso antes da confirmação do banco de dados devido à ordem de chamadas no frontend e à falta de políticas de RLS abrangentes para inserção na tabela `platform_materials`.

## Alterações Propostas

### Backend (Banco de Dados)
- Revisar as políticas de RLS da tabela `platform_materials`.
- Adicionar uma política de `INSERT` e `UPDATE` explícita para administradores (papel `admin`), garantindo que a verificação de segurança ocorra no nível do banco de dados.

### Frontend
- **src/routes/admin.materiais.tsx**:
    - Ajustar a lógica de upload para que a mensagem de sucesso do upload do arquivo não seja confundida com o sucesso do salvamento do material.
    - Mover a notificação de sucesso para dentro do callback `onSuccess` da mutação `upsertMutation`, garantindo que ela só dispare após a resposta positiva do servidor.
    - Melhorar os estados de carregamento (loading) nos botões de upload individuais para dar feedback visual durante o processamento.

### Funções do Servidor
- **src/lib/materials.functions.ts**:
    - Garantir que erros de RLS capturados pelo cliente Supabase no servidor sejam propagados corretamente para o frontend, acionando o bloco `onError` da mutação.

## Detalhes Técnicos
- Utilização de `has_role(auth.uid(), 'admin')` nas políticas de RLS.
- Sincronização de estados de UI com o ciclo de vida do TanStack Query.
- Tratamento rigoroso de nulos em campos como `category` e `external_url` para evitar falhas de validação.
