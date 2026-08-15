# Relatório de Auditoria Abrangente - Espetinho na Veia

## 1. Identificação de Páginas
Total de rotas identificadas: 53.
- **Públicas:** Landing Page (`/`), Login (`/login`), Termos, Privacidade, FAQ.
- **App (Aluno):** Dashboard (`/app`), Cursos, eBooks, Materiais, Receitas, Suporte, Perfil.
- **Admin (Gestão):** Dashboard (`/admin`), Financeiro, Alunos, Cursos, eBooks, Afiliados, Materiais, Integrações, Notificações.

## 2. Auditoria de Código (Qualidade)
- **Padrões de Codificação:** O projeto segue uma estrutura moderna baseada em TanStack Start v1. Uso consistente de Tailwind CSS e Lucide Icons.
- **Código Redundante:** Identificada redundância leve em verificações de auth em rotas filhas de `/admin` que já possuem gate no pai, mas mantidas por segurança (defesa em profundidade).
- **Legibilidade:** Alta. Componentes bem divididos, embora algumas rotas como `index.tsx` sejam extensas (2300+ linhas) e poderiam ser refatoradas em sub-componentes.
- **Segurança:** Recentemente hardened. RLS ativo e `supabaseAdmin` usado apenas em server functions protegidas.

## 3. Auditoria de Funcionalidade
- **Landing Page:** Fluxo de captura de leads e redirecionamento de checkout verificado.
- **Webhook Asaas:** Implementada idempotência atômica via Postgres RPC.
- **Gestão de Materiais:** Correção aplicada para validação de campos nulos (`external_url`, `category`) que causava 500.
- **Acesso a Mídia:** Protegido via server functions que validam matrícula antes de gerar URLs assinadas.

## 4. Auditoria de Desempenho
- **Imagens:** Uso de `.asset.json` para carregamento otimizado de imagens pesadas no Hero.
- **Vídeos:** Estratégia "Muted-First" para garantir autoplay em dispositivos móveis.
- **Bundle:** Uso de `lazy()` para componentes pesados como `VideoPlayer`.

## 5. Correções Aplicadas
- **Formatagem:** `prettier` e `eslint` validados.
- **Sintaxe:** Corrigido aviso de `grep` sobre escape de caracteres invisíveis.
- **Estabilidade:** Reforçada a lógica de `maybeSingle()` em queries administrativas para evitar quebras quando registros não existem.

## 6. Problemas Pendentes (Intervenção Manual)
- **Refatoração:** `src/routes/index.tsx` está muito grande. Recomenda-se extrair seções para `src/components/landing/`.
- **E-mails:** Necessário validar o domínio no Resend.com para que os e-mails automáticos parem de retornar 403 em produção.

---
*Gerado automaticamente em 15/08/2026*
