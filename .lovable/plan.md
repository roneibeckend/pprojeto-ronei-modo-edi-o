# Plano de Estabilização e Correção do Gerenciamento de Rankings

Este plano visa resolver as falhas reportadas no gerenciamento de rankings e campanhas, garantindo que as configurações globais, a criação de campanhas e a exibição de vencedores funcionem corretamente para administradores e alunos.

## Problemas Identificados
1.  **Cache e HMR do TanStack Router**: Relatos anteriores indicam que o menu de ranking às vezes não responde ou não atualiza devido a problemas de cache.
2.  **Segurança e RLS**: As funções RPC de ranking e campanhas precisam de permissões explícitas para garantir que apenas administradores possam gerenciar dados sensíveis, enquanto alunos podem visualizar o ranking.
3.  **Integridade de Dados**: Garantir que as configurações de ranking (datas e modo global) sejam persistidas corretamente na tabela `integrations`.
4.  **UX do Aluno**: Garantir que o ranking filtrado por período reflita exatamente o que foi configurado no painel administrativo.

## Ações Propostas

### 1. Banco de Dados e Segurança (SQL)
*   Reforçar as permissões de RLS para as tabelas `ranking_campaigns` e `campaign_winners`.
*   Garantir que a função `get_student_ranking_v2` retorne nomes anonimizados para alunos, mas completos para administradores (ou manter o padrão de privacidade atual).
*   Verificar a existência da coluna `credentials` na tabela `integrations` para evitar erros de inserção nas configurações de ranking.

### 2. Backend (Server Functions)
*   Revisar `src/lib/ranking.functions.ts` e `src/lib/campaigns.functions.ts` para garantir que erros de banco de dados sejam capturados e reportados corretamente ao frontend.
*   Garantir o uso de `supabaseAdmin` onde necessário para contornar restrições de RLS durante a gestão administrativa, validando sempre o papel do usuário.

### 3. Frontend e UI/UX
*   Ajustar `src/routes/admin.ranking.tsx` e `src/routes/admin.ranking.campanhas.tsx` para garantir que o estado das mutações seja refletido na UI (loaders, toasts de sucesso/erro).
*   Corrigir o componente de submenu no `src/routes/admin.tsx` para garantir que a navegação entre "Configuração" e "Campanhas" seja fluida e sem bugs de cache.
*   Validar a exibição do ranking na rota do aluno (`src/routes/app.progresso.tsx`) para assegurar que os filtros de data aplicados pelo administrador estão funcionando.

### 4. Validação
*   Realizar testes de ponta a ponta simulando um administrador criando uma campanha e um aluno visualizando-a.
*   Verificar logs de sistema para assegurar que nenhum erro silencioso está ocorrendo nas server functions.

## Detalhes Técnicos
*   **Tabelas Afetadas**: `integrations`, `ranking_campaigns`, `campaign_winners`, `user_stats`, `progress_tracking`.
*   **Rotas**: `/admin/ranking`, `/admin/ranking/campanhas`, `/app/progresso`.
*   **Tecnologias**: TanStack Start v1, Supabase (RLS & RPC).
