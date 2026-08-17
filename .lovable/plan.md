# Plano de Auditoria Final e Estabilidade ("GO-LIVE")

Este plano foca na estabilidade do produto, correções críticas identificadas na auditoria pré-lançamento e garantia de privacidade.

## 1. Privacidade no Ranking de Alunos
- **Objetivo:** Impedir a exposição de e-mails completos e garantir anonimato parcial quando necessário.
- **Ações:**
    - Criar nova migração SQL para atualizar a função `get_student_ranking_v2`.
    - Lógica de fallback: `COALESCE(p.full_name, p.display_name, 'Aluno #' || substring(p.id::text, 1, 4))`.
    - Garantir que administradores continuem excluídos do ranking.
    - Testar visualização no `/app/progresso`.

## 2. Otimização do PWA
- **Objetivo:** Garantir que o PWA utilize ativos locais e possua ícones corretos.
- **Ações:**
    - Baixar/Criar ícones oficiais (192x192, 512x512) e salvar em `public/icons/`.
    - Atualizar `public/manifest.json` para apontar para caminhos locais.
    - Adicionar `apple-touch-icon` em `src/routes/__root.tsx`.

## 3. Preservação de Tabelas Legadas
- **Objetivo:** Manter `modules` e `lessons` por segurança técnica.
- **Ações:**
    - Realizar busca exaustiva (concluído: existem referências em `types.ts` e migrações antigas).
    - Classificar como "Dívida Técnica" na documentação interna.

## 4. Auditoria de Rotas Administrativas (`/admin`)
- **Objetivo:** Validar funcionalidade e estabilidade de todas as rotas de gestão.
- **Inventário de Rotas:**

| # | Rota | Página | Funções Principais | Status |
|---|------|--------|--------------------|--------|
| 1 | `/admin` | Dashboard | Visão geral, estatísticas rápidas | Não Aprovada |
| 2 | `/admin/alunos` | Gestão de Alunos | Lista, busca, detalhes de aluno | Não Aprovada |
| 3 | `/admin/cursos` | Gestão de Cursos | CRUD de cursos, módulos e aulas | Não Aprovada |
| 4 | `/admin/ebooks` | Gestão de E-books | CRUD de e-books e capítulos | Não Aprovada |
| 5 | `/admin/financeiro` | Financeiro | Dashboard financeiro, saques | Não Aprovada |
| 6 | `/admin/materiais` | Materiais | Gestão de arquivos e links externos | Não Aprovada |
| 7 | `/admin/suporte` | Suporte | Atendimento de tickets | Não Aprovada |
| 8 | `/admin/relatorios` | Relatórios | Exportação e análise de dados | Não Aprovada |
| 9 | `/admin/ranking` | Config. Ranking | Filtros de período e global | Não Aprovada |
| 10 | `/admin/ao-vivo` | Aulas ao Vivo | Agendamento e notificações | Não Aprovada |
| 11 | `/admin/usuarios` | Equipe | Gestão de administradores/gerentes | Não Aprovada |
| 12 | `/admin/integracoes`| Hub de Integrações| Configuração de APIs (Asaas, Resend) | Não Aprovada |
| 13 | `/admin/chatbot` | Gestão do Brasa | Base de conhecimento e IA | Não Aprovada |

## 5. Fluxos Críticos e Regressão
- **Ações ao Vivo:** Validar acesso restrito por matrícula.
- **E-mails (Resend):** Testar recuperação de senha e boas-vindas.
- **Asaas:** Validar carregamento do hub financeiro sem erros de coerção.
- **PWA:** Testar instalação e navegação standalone.

## Detalhes Técnicos
- **SQL Migration:** Atualização da função `get_student_ranking_v2` com lógica de nomes.
- **PWA Manifest:** Correção de URLs absolutas para caminhos relativos.
- **Admin Shell:** Garantir que o `Shell.tsx` administrativo seja responsivo em mobile.
