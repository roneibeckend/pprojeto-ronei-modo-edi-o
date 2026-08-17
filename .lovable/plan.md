# Plano: Auditoria e Estabilidade do Painel Administrativo

Realizar uma auditoria técnica e funcional nas rotas administrativas para garantir estabilidade, segurança e integridade de dados.

## Ações Técnicas

### 1. Infraestrutura de Banco de Dados
- **Idempotência Asaas:** Implementar a tabela `asaas_webhook_events` e a RPC `acquire_asaas_webhook_claim` para evitar processamento duplicado de pagamentos (Prevenção de bugs financeiros).
- **Gestão de Sócios:** Implementar `partner_balances` e RPCs de distribuição de lucros (`distribute_partner_profits`) para suportar a funcionalidade da rota `/admin/financeiro`.
- **Integridade de Relatórios:** Garantir que `report_settings` e `report_logs` possuam a estrutura correta para evitar crashes (Adição da coluna `message` se ausente).

### 2. Validação de Rotas e Funcionalidades
- **Dashboard (/admin):** Validar queries de estatísticas (Alunos, Vendas, Cursos, Tickets) para refletir dados em tempo real.
- **Financeiro (/admin/financeiro):** Testar integração com Asaas e fluxo de distribuição de lucros.
- **Relatórios (/admin/relatorios):** Resolver crashes identificados e validar envio de e-mails via Resend.
- **Alunos (/admin/alunos):** Testar edição de perfis e navegação para detalhes do aluno.
- **Suporte (/admin/suporte):** Validar fluxo de tickets (abertura, resposta e resolução).
- **Materiais (/admin/materiais):** Garantir upload e download seguro via URLs assinadas.

### 3. Segurança (RLS)
- Auditar e reforçar políticas de RLS em tabelas críticas para garantir que apenas usuários com `has_role('admin')` ou módulos específicos possam acessar dados sensíveis.

## Detalhes Técnicos
- **Migrações:** Utilização de SQL `SECURITY DEFINER` para funções que necessitam de bypass controlado de RLS.
- **Cache:** Otimização de queries com `TanStack Query` para melhorar performance do dashboard.
- **Logs:** Centralização de falhas de integração na tabela `integration_logs`.
