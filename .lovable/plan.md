---
name: Plano de Implementação: Relatório Financeiro via WhatsApp
description: Automação de envio diário de faturamento e custos com painel de gestão.
type: feature
---

# Plano de Implementação: Relatório Financeiro WhatsApp

## 1. Auditoria e Estrutura de Dados
O sistema atual registra vendas via `course_enrollments`. Não há uma tabela de despesas fixas/variáveis reais no banco; o painel financeiro atual usa estado local do React.
Implementaremos:
- `report_recipients`: Gestão de quem recebe.
- `report_settings`: Configurações de envio.
- `report_logs`: Auditoria de disparos.

## 2. Interface Administrativa (`/admin/relatorios`)
Nova tela para:
- Listar e gerenciar destinatários (Nome, WhatsApp E.164).
- Configurar horário de envio e timezone.
- Botão "Enviar Teste".
- Visualizar status dos últimos envios.

## 3. Edge Function (`daily-financial-report`)
Função em Deno para:
- Consultar `course_enrollments` para calcular faturamento do dia.
- Calcular lucro (Receita - Custos configurados).
- Formatar mensagem amigável para WhatsApp.
- Integração com provedores (abstração de API).
- Tratamento de retries e logs.

## 4. Automação (Agendamento)
- Utilização de `pg_cron` para disparar a função no horário definido.
- Sincronização automática entre o horário na UI e o Job de Cron.

## 5. Segurança
- Proteção da função via `REPORT_INTERNAL_SECRET`.
- Uso de `service_role` apenas no servidor.
- Mascaramento de dados sensíveis em logs.
