# Plano de Ativação do Supabase (Lovable Cloud)

Este plano detalha as etapas para garantir que a integração com o Supabase esteja totalmente operacional no projeto, utilizando a infraestrutura da Lovable Cloud.

## 1. Verificação da Infraestrutura
- Confirmar a presença dos arquivos de integração gerados automaticamente (`src/integrations/supabase/`).
- Validar se as variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) estão configuradas internamente pela plataforma.

## 2. Configuração de Autenticação e Middleware
- Verificar o `src/start.ts` para garantir que o `attachSupabaseAuth` está registrado no `functionMiddleware`, permitindo que server functions autenticadas funcionem corretamente.
- Garantir que o `requireSupabaseAuth` está disponível para proteger rotas e funções sensíveis.

## 3. Estrutura de Banco de Dados e RLS
- Executar uma migração para garantir que as tabelas essenciais (`profiles`, `user_roles`) existam com as permissões corretas.
- Configurar políticas de Row Level Security (RLS) e conceder privilégios (`GRANT`) para os papéis `authenticated`, `anon` e `service_role`.

## 4. Integração de Storage (Opcional)
- Criar buckets de armazenamento caso necessário para uploads de avatar ou materiais de curso.

## 5. Validação de Conectividade
- Realizar um teste de sanidade chamando uma server function que consulte o banco de dados via cliente Supabase autenticado.

---
**Nota:** Como a Lovable Cloud já está ativa para este projeto (conforme indicado no contexto), a maioria das configurações de infraestrutura já está presente. Focaremos em garantir que o fluxo de código esteja alinhado com as melhores práticas do TanStack Start + Supabase.
