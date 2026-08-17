# Plano de Auditoria Final e Estabilidade ("GO-LIVE")

Este plano visa garantir que a plataforma "Espetinho na Veia" esteja 100% operacional, segura e performática para o lançamento oficial, preservando todas as correções de auditorias anteriores.

## Objetivo
Validar fluxos críticos, segurança RLS, responsividade mobile e performance, corrigindo apenas o estritamente necessário para o lançamento.

## Etapas de Execução

### 1. PWA e Ícones (Concluído)
- [x] Garantir que os ícones do PWA sejam carregados localmente (`public/icons/`).
- [x] Validar `manifest.json` e `apple-touch-icon`.

### 2. Privacidade e Ranking (Concluído)
- [x] Validar que o ranking de alunos oculta nomes/e-mails sensíveis (usando fallback de ID).
- [x] Garantir que a função `get_student_ranking_v2` é segura.

### 3. Segurança de Conteúdo e Aulas ao Vivo (Concluído)
- [x] Implementar RLS restrito em `live_classes` (Apenas matriculados ou admin podem ver links).
- [x] Validar notificações de e-mail automatizadas no backend.

### 4. Auditoria de Rotas Admin (Em Andamento)
- [ ] **Visão Geral (`/admin`):** Validar cards de estatísticas (vendas, alunos, suporte).
- [ ] **Financeiro (`/admin/financeiro`):** Validar integração Asaas e distribuição de lucros.
- [ ] **Relatórios (`/admin/relatorios`):** Corrigir crashes relatados e testar envio de logs.
- [ ] **Alunos (`/admin/alunos`):** Testar edição de perfis e visualização de detalhes.
- [ ] **Suporte (`/admin/suporte`):** Validar sistema de tickets e respostas Brasa.
- [ ] **Materiais (`/admin/materiais`):** Testar upload/download seguro de arquivos.

### 5. Fluxo de Compra e Pós-Venda
- [ ] Validar persistência de checkout (`pending_checkouts`) após login.
- [ ] Garantir que o upsell (`PostPurchaseOffer`) é exibido corretamente no primeiro acesso.
- [ ] Testar redirecionamento automático pós-pagamento.

### 6. Estabilidade de UI/UX Mobile
- [ ] Revisar `VideoPlayer.tsx` para garantir 9:16 estável e autoplay silenciado.
- [ ] Validar safe-areas em iPhones (notch) e evitar zoom em inputs.

## Detalhes Técnicos

### Resiliência Visual
Foi injetado um script no `__root.tsx` para detectar falhas de carregamento de chunk (comum em redes móveis) e forçar o reload da aplicação, evitando a "tela branca".

### Segurança RLS
As políticas de `live_classes` foram reforçadas para verificar a existência de matrículas (`course_enrollments` ou `ebook_enrollments`) antes de liberar acesso aos dados via API.

### Melhorias no Ranking
A função SQL agora garante anonimato por padrão: `COALESCE(p.name, 'Aluno #' || substring(p.id::text, 1, 4))`.
