# Plano: Investigação e Correção de Erros de Autenticação em Materiais

A mensagem "Não autenticado" foi introduzida recentemente como uma verificação manual dentro da função `upsertMaterial` para garantir que o contexto do usuário esteja presente antes de realizar operações administrativas. Esta alteração foi feita para permitir o uso do cliente admin no servidor, contornando limitações de RLS.

## Análise
O erro "Não autenticado" ocorre quando `supabase.auth.getUser()` retorna nulo no servidor. Isso pode acontecer se:
1. O token de autenticação não estiver sendo enviado corretamente pelo frontend.
2. Houver um problema na reconstrução da sessão no servidor pelo cliente Supabase.
3. O middleware `attachSupabaseAuth` falhar ao anexar o cabeçalho Authorization.

## Alterações Propostas

### 1. Diagnóstico do Cliente Supabase
- Verificar se `supabase.auth.getUser()` no servidor está configurado para ler os cabeçalhos corretamente em um ambiente TanStack Start (que usa o middleware para injetar o bearer token).

### 2. Refinamento de Verificação de Autenticação
- **src/lib/materials.functions.ts**:
    - Melhorar o log de erro para distinguir entre "Token Ausente" e "Usuário não encontrado na base".
    - Adicionar verificação explícita de cabeçalhos no handler para garantir que o token chegou ao servidor.

### 3. Melhoria na Experiência do Usuário (UX)
- Se o erro for genuinamente de autenticação expirada, redirecionar o usuário para o login em vez de apenas mostrar um toast estático.

## Detalhes Técnicos
- O TanStack Start envia funções do servidor via RPC. O middleware em `src/start.ts` anexa o cabeçalho.
- Investigar se o cliente Supabase importado em `src/lib/materials.functions.ts` é o cliente correto para o servidor (SSR/Server Functions).
