# Plano de Correção: Visibilidade de Registros no Painel Administrativo

O objetivo deste plano é investigar e corrigir a falha de visibilidade de novos registros (usuários e colaboradores) no painel administrativo. Identificamos que a ausência de permissões explícitas (`GRANT`) nas tabelas do Supabase está impedindo que o PostgREST (API de dados) acesse as informações, mesmo que o registro exista no banco.

## Problemas Identificados
1. **Falta de GRANTs:** As tabelas `profiles`, `user_roles` e `admin_permissions` não possuem permissões concedidas para os papéis `authenticated` e `service_role`. No Supabase, sem `GRANT`, a API retorna erro de permissão por padrão.
2. **Restrição de Filtros em /admin/usuarios:** A página de equipe filtra apenas usuários que já possuem uma entrada na tabela `user_roles`. Novos usuários registrados via formulário padrão entram como `student` (sem entrada em `user_roles` por padrão) e não aparecem na lista de equipe.
3. **Restrição de Filtros em /admin/alunos:** A lista de alunos na administração está correta ao listar todos os perfis, mas a falha de `GRANT` impede a visualização dos dados.

## Etapas de Implementação

### 1. Banco de Dados (Segurança e Acesso)
*   Executar uma migração para conceder permissões (`GRANT`) nas tabelas críticas.
*   Garantir que os papéis `authenticated` e `service_role` possam ler e gravar nas tabelas conforme as políticas de RLS já existentes.

### 2. Painel Administrativo (Lógica de Exibição)
*   **Gestão de Equipe (`/admin/usuarios`):** 
    *   Ajustar a consulta para ser mais resiliente, garantindo que usuários com funções administrativas sejam listados corretamente.
    *   Verificar a lógica de carregamento para garantir que novos colaboradores adicionados via banco apareçam imediatamente.
*   **Gestão de Alunos (`/admin/alunos`):**
    *   Validar se a consulta de perfis está retornando todos os registros persistidos.
    *   Garantir que a paginação e a busca não estejam ocultando registros recém-criados.

### 3. Verificação de Persistência
*   Confirmar que o fluxo de cadastro está populando corretamente a tabela `public.profiles`.
*   Validar se o trigger de criação de perfil (se existir) ou a lógica de inserção manual está funcionando conforme esperado para novos usuários.

## Detalhes Técnicos
*   **SQL:** `GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;` (e similar para outras tabelas).
*   **RLS:** Manter as políticas atuais que restringem o acesso baseado na função `has_role(auth.uid(), 'admin')`.
*   **Frontend:** Nenhuma mudança visual drástica, apenas correção na recuperação dos dados via SDK do Supabase.

---

Eu irei prosseguir com a aplicação dessas correções assim que você aprovar o plano.
