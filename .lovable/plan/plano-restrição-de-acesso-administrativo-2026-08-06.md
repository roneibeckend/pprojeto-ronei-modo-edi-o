---
name: Restrição de Acesso Administrativo
description: Implementação de verificações de papel 'admin' no frontend para proteger menus e rotas administrativas.
type: feature
---

# Plano: Restrição de Acesso Administrativo

O objetivo é garantir que apenas usuários com o papel `admin` na tabela `user_roles` possam visualizar e acessar funcionalidades administrativas.

## 1. Hook de Autenticação e Autorização
- Criar `src/hooks/use-auth.ts` para encapsular a lógica de verificação de sessão e papel do usuário via RPC `has_role`.

## 2. Proteção de Menus (Shell)
- Modificar `src/components/platform/Shell.tsx` para:
  - Consumir o hook `useAuth`.
  - Filtrar o grupo de navegação "Gestão" para que seja exibido apenas se `isAdmin` for verdadeiro.

## 3. Proteção de Rotas (Layouts Admin)
- Modificar `src/routes/admin.tsx` e `src/routes/app.admin.tsx` para realizar uma verificação de segurança no componente:
  - Se o usuário não for admin, redirecionar para `/app` ou exibir uma página de acesso negado.

## 4. Segurança no Cadastro
- Garantir que novos usuários criados via `src/routes/login.tsx` não recebam o papel de admin por padrão (o que já é o comportamento padrão, mas faremos uma revisão visual).

## 5. Validação
- Testar com um usuário comum para garantir que os menus de gestão desapareçam.
- Testar o acesso direto via URL para garantir o redirecionamento/bloqueio.
