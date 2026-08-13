# Plano: Visibilidade de Usuários sem Compras no Painel Administrativo

Este plano visa investigar e corrigir o problema onde perfis de usuários criados via teste (sem compras) não aparecem no painel administrativo, garantindo que todos os perfis, independentemente do histórico de compras, sejam visíveis.

## Análise
O problema parece ocorrer em dois níveis:
1.  **Gestão de Equipe (`/admin/usuarios`):** A lógica atual filtra estritamente por usuários que possuem uma role atribuída na tabela `user_roles` (como `admin`, `manager` ou `agent`). Novos cadastros, por padrão, não têm uma role explícita na `user_roles`, sendo tratados como `student` dinamicamente pelo hook `useAuth`.
2.  **Gestão de Alunos (`/admin/alunos`):** Embora a consulta ao banco de dados seja direta na tabela `profiles`, a interface pode estar aplicando filtros de busca ou apresentando falhas na renderização de novos perfis. Além disso, as permissões de RLS podem estar restringindo a visualização se não estiverem configuradas para o papel de `service_role` ou administradores autenticados de forma ampla.

## Etapas de Implementação

### 1. Ajuste na Lógica de Gestão de Equipe
Modificar `src/routes/admin.usuarios.tsx` para permitir que administradores visualizem usuários que ainda não têm role atribuída, possibilitando a promoção de usuários comuns a colaboradores.

### 2. Otimização da Gestão de Alunos
Revisar `src/routes/admin.alunos.tsx` para garantir que a listagem inicial não dependa de nenhuma condição de compra e que a busca local não ignore perfis recém-criados.

### 3. Verificação de Políticas de RLS
Garantir que as políticas de segurança da tabela `profiles` permitam que administradores vejam todos os registros, independentemente de estarem associados a compras.

### 4. Teste de Validação
Criar um script de teste para simular a criação de um usuário sem compras e verificar sua presença automática nas telas administrativas.

## Detalhes Técnicos
*   **Filtros no Frontend:** Remover a filtragem estrita no `map` de usuários no frontend da rota de equipe.
*   **Consultas Supabase:** Verificar se há algum `.in()` ou `.eq()` oculto que restrinja a busca a usuários com matrículas.
*   **Dados Iniciais:** Garantir que o contador do dashboard (`admin.index.tsx`) também reflita a contagem total de perfis.
