# Auditoria Avançada de Falhas e Edge Cases

Esta auditoria visa identificar comportamentos inesperados em condições adversas, concorrência e falhas de rede, indo além do fluxo feliz.

## 1. Autenticação e Sessão
- **LOGIN ADVERSO**: Testar refresh e botão "voltar" durante o processo de login/signup.
- **MÚLTIPLAS ABAS**: Logout em uma aba deve invalidar a sessão na outra aba instantaneamente ou na próxima ação protegida.
- **SESSÃO EXPIRADA**: Simular expiração de token e verificar se o redirecionamento para login preserva o contexto (`redirectTo`).

## 2. Integridade de Dados e Erros
- **DADOS OPCIONAIS**: Verificar se perfis sem nome, avatar ou telefone quebram componentes (ex: Ranking, Dashboard).
- **404/ESTADOS INEXISTENTES**: Acessar IDs aleatórios em `/app/cursos/$id` e `/app/ebooks/$id`. Deve exibir 404 limpo via `notFound()`.
- **CONTROLE DE ACESSO**: Tentar URL direta de curso não adquirido. O sistema deve bloquear via UI ou redirecionar.

## 3. Concorrência e Idempotência
- **DUPLO CLIQUE**: Ações críticas (Comprar, Concluir Aula, Salvar Perfil) devem ser protegidas contra cliques repetidos.
- **WEBHOOK IDEMPOTÊNCIA**: Validar se `asaas_webhook_events` realmente bloqueia eventos duplicados do Asaas.
- **PROGRESSO CONCORRENTE**: Marcar aula como concluída em duas abas quase simultaneamente.

## 4. Resiliência de Rede
- **INTERNET LENTA**: Validar estados de loading e skeletons (CourseCardSkeleton, etc.).
- **FALHA DE CONEXÃO**: Simular queda de rede durante o checkout e verificar mensagens de erro amigáveis ao invés de crashes.

## 5. Auditoria Financeira
- **FLUXO DE COMPRA**: Refresh na página de Upsell ou voltar após aceitar não deve duplicar cobranças.
- **DISTRIBUIÇÃO DE LUCROS**: Validar concorrência na execução da RPC de divisão de lucros para sócios.

## Detalhes Técnicos
- Utilização de `lovable auth-session` para simular múltiplos usuários.
- Scripts Playwright em `/tmp/browser/audit/` para testes de carga/concorrência.
- Verificação de RLS em tabelas críticas (`payments`, `enrollments`, `live_classes`).
- Inspeção de logs de servidor para capturar erros silenciosos.
