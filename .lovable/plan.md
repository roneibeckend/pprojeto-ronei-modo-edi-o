# Plano de Remoção do Ícone de Ajuda na Área de Membros

Este plano descreve a remoção visual do ícone de "Ajuda e Suporte" (LifeBuoy/HelpCircle) do cabeçalho da área de membros e do painel administrativo, conforme solicitado para limpar a interface e reduzir distrações.

## Alterações Técnicas

### 1. Área do Aluno (Área de Membros)
- **Arquivo:** `src/components/platform/Shell.tsx`
- **Ação:** Remover o componente `<Link to="/app/suporte" ...>` que renderiza o ícone `LifeBuoy` no cabeçalho (header) da aplicação.
- **Nota:** O acesso ao suporte continuará disponível através do menu lateral (Sidebar), mantendo a funcionalidade acessível sem a obstrução visual no topo fixo.

### 2. Painel Administrativo
- **Arquivo:** `src/routes/admin.tsx`
- **Ação:** Remover o componente `<Link to="/admin/suporte" ...>` que renderiza o ícone `HelpCircle` tanto no cabeçalho desktop quanto na barra mobile.
- **Nota:** Assim como na área do aluno, a opção "Suporte" permanece listada no menu de navegação lateral para garantir que o administrador ainda possa acessar a ferramenta quando necessário.

## Verificação e Impacto
- A remoção é puramente visual nos locais especificados.
- Não haverá alteração nas rotas `/app/suporte` ou `/admin/suporte`.
- Nenhuma outra funcionalidade ou estilo será afetado.
- Testes visuais serão realizados para garantir que o alinhamento dos itens restantes no cabeçalho (notificações e perfil) permaneça correto.

## Detalhes Adicionais
- O ícone a ser removido é o que aparece no canto superior direito das páginas internas.
- A remoção segue a restrição de ser aplicada apenas à área autenticada ("área de membros").
