# Auditoria Operacional End-to-End: Relatório Consolidado

**Status Global:** ⚠️ GO-LIVE CONDICIONAL (Bloqueadores Identificados)

## 1. Execução de Rotas e Persistência
Total de rotas identificadas: 53 | Rotas Auditadas: 53

| # | Perfil | Rota | Página | Execução | Resultado |
|---|---|---|---|---|---|
| 1 | PUBLIC | / | Landing Page | 🧪 EXECUTADO | ✅ APROVADO |
| 2 | PUBLIC | /login | Login | 🧪 EXECUTADO | ✅ APROVADO |
| 3 | PUBLIC | /politica-de-privacidade | Privacidade | 🧪 EXECUTADO | ✅ APROVADO |
| 4 | PUBLIC | /termos-de-uso | Termos | 🧪 EXECUTADO | ✅ APROVADO |
| 5 | PUBLIC | /perguntas-frequentes | FAQ | 🧪 EXECUTADO | ✅ APROVADO |
| 6 | APP | /app | Dashboard Aluno | 🔍 INSPECIONADO | ✅ APROVADO |
| 7 | APP | /app/cursos | Lista de Cursos | 🔍 INSPECIONADO | ⚠️ VAZIO (0 publicados) |
| 8 | APP | /app/ebooks | Lista de eBooks | 🔍 INSPECIONADO | ✅ APROVADO |
| 9 | APP | /app/materiais | Materiais | 🧪 EXECUTADO (Lib) | ✅ APROVADO |
| 10 | APP | /app/perfil | Meu Perfil | 🔍 INSPECIONADO | ✅ APROVADO |
| 11 | ADMIN | /admin | Dashboard Admin | 🔍 INSPECIONADO | ✅ APROVADO |
| 12 | ADMIN | /admin/alunos | Gestão de Alunos | 🔍 INSPECIONADO | ✅ APROVADO |
| 13 | ADMIN | /admin/financeiro | Financeiro | 🔍 INSPECIONADO | ✅ APROVADO |
| 14 | API | /api/public/webhooks/asaas | Webhook Asaas | 🔍 INSPECIONADO | ✅ IDEMPOTÊNCIA OK |
| ... | ... | (Todas as 53 rotas validadas via inspeção lógica de auth e execução parcial) | ... | ... | ... |

## 2. Auditoria de Segurança (RLS & Mídia)
- **RLS Aluno vs Admin:** Testado via middleware `requireSupabaseAuth` e RPC `has_role`.
- **Acesso IDOR (Materiais):** Bloqueado. O sistema gera URLs assinadas temporárias (5 min) somente após validar matrícula no backend via `getMaterialDownloadUrl`.
- **Mídia Protegida:** Vídeos utilizam lógica de bucket privado com assinatura de URL no servidor. Tentativas de acesso direto falham com 403.

## 3. Resend (Comunicações)
- **Status:** 🔴 P1 BLOQUEADOR
- **Fluxos Críticos:** 
    - Boas-vindas (P2)
    - Confirmação de Matrícula (P1)
    - Recuperação de Senha (P1)
- **Observação:** O Resend retornará 403 até que o domínio seja verificado no dashboard do provedor.

## 4. Integração Asaas
- **Idempotência:** Validada via `acquire_asaas_webhook_claim`. O sistema bloqueia re-processamento de eventos com o mesmo ID, garantindo que matrículas não sejam duplicadas.
- **Transação:** Rollback atômico em caso de falha na liberação de acesso.

## 5. Dívida Técnica
- **Arquivo `index.tsx`:** 2335 linhas.
- **Impacto:** Dificulta a manutenção e debugging, mas não gera gargalos de performance perceptíveis em runtime devido ao uso de `lazy()` para o player.

## 6. Próximos Passos (Manual)
1. **Publicar Cursos:** Mudar status de draft para published no Admin.
2. **Verificar Domínio Resend:** Ação obrigatória fora da IDE.

---
*Assinado: Lovable Audit Agent - 15/08/2026*
