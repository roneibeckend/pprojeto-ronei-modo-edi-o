# Plano de Branding: Ronnei na Veia

Este plano detalha a transição completa da identidade visual e textual de "Espetinho na Veia" para "Ronnei na Veia", garantindo consistência em toda a plataforma (PWA, SEO, Dashboards e Conteúdo).

## Alterações Realizadas

### 1. Identidade do Aplicativo (PWA & Metadados)
- [x] **Manifesto PWA:** Atualizado `public/manifest.json` com `name` e `short_name` para "Ronnei na Veia".
- [x] **Metadados Globais:** Atualizado `src/routes/__root.tsx` (Title e Apple Mobile Web App Title).
- [x] **SEO Landing Page:** Atualizado `src/routes/index.tsx` (Title, OG tags, Schema JSON-LD).

### 2. Branding da Interface (UI)
- [x] **Sidebar & Header:** Atualizado `src/components/platform/Shell.tsx` para exibir "Ronnei na Veia" no topo e no menu lateral.
- [x] **Footer:** Atualizado rodapé da landing page (`src/routes/index.tsx`) com o novo copyright e logo.

### 3. Títulos de Rotas da Área do Aluno
- [x] **Visão Geral:** `src/routes/app.index.tsx`
- [x] **Meus Cursos:** `src/routes/app.cursos.index.tsx`
- [x] **Meu Perfil:** `src/routes/app.perfil.tsx`
- [x] **Suporte:** `src/routes/app.suporte.tsx`
- [x] **Certificados:** `src/routes/app.certificados.tsx`
- [x] **Receitas:** `src/routes/app.receitas.tsx`
- [x] **Planilhas/Materiais:** `src/routes/app.materiais.tsx`
- [x] **Ranking:** `src/routes/app.progresso.tsx`

### 4. Conteúdo Específico e Certificados
- [x] **Certificados:** Atualizado logo interno, rodapé de verificação e títulos em `src/routes/app.certificados.tsx`.
- [x] **Curso Individual:** Atualizado título de SEO e equipe em `src/routes/app.cursos.$courseId.tsx`.
- [x] **E-book Individual:** Atualizado título de SEO em `src/routes/app.ebooks.$ebookId.tsx`.
- [x] **Materiais:** Ajustado subtítulo para remover menção a "espetinhos" genéricos em favor de "churrasco" (alinhado ao branding de Ronnei).

## Próximos Passos Sugeridos
1. **Ativos Visuais:** Recomenda-se que o usuário faça o upload do novo logo oficial em `public/logo.png` e ícones PWA para substituir os placeholders.
2. **Domínio:** Caso deseje, configurar o domínio customizado `ronneinaveia.com` no painel de publicação para total alinhamento.

## Detalhes Técnicos
- A mudança foi realizada principalmente via substituição de strings em componentes de SEO e Layout.
- O nome exibido abaixo do ícone no celular (PWA) agora é estritamente "Ronnei na Veia".
- A persistência do branding no PWA depende do cache do navegador, podendo exigir uma nova instalação ou recarregamento forçado.
