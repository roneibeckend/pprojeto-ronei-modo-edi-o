# Plano de Correção: Fluxo de Compra Pós-Cadastro

Este plano visa corrigir o redirecionamento após o cadastro na Landing Page, garantindo que o usuário seja levado ao checkout do produto selecionado em vez da página geral `/app`.

## Alterações

### 1. Landing Page (`src/routes/index.tsx`)
- Modificar o componente `LeadForm` para, após o sucesso do cadastro do lead, exibir um botão que redireciona o usuário para o checkout com os parâmetros corretos (`buy` e `type`).
- Atualizar a URL de checkout no `CheckoutButton` para incluir esses parâmetros, garantindo que a intenção de compra seja preservada.

### 2. Fluxo de Login/Cadastro (`src/routes/login.tsx`)
- Adicionar suporte para um parâmetro `redirectTo` na URL.
- Após o login ou cadastro bem-sucedido, verificar se existe um `redirectTo` e priorizá-lo em vez do redirecionamento padrão para `/inicio`.
- Isso garante que se o usuário for enviado para a tela de login durante o fluxo de compra, ele retorne ao destino correto.

### 3. Página de Cursos (`src/routes/app.cursos.index.tsx`)
- Refinar a lógica de `auto-buy` que já existe no `useEffect`.
- Garantir que, se o usuário chegar com os parâmetros `buy` e `type`, o sistema inicie o processo de checkout imediatamente após carregar os dados necessários.

## Detalhes Técnicos
- Utilização de `URLSearchParams` para gerenciar o estado do redirecionamento através das rotas.
- Preservação do contexto do produto (ID do ebook: `ee1a776c-6c7d-4a88-a980-7e671ad8d4fb`) em todas as etapas do fluxo de aquisição.
- Implementação de um redirecionamento automático suave para melhorar a experiência do usuário (UX).
