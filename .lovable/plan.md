# Plano: Implementação de Vídeos Curtos (Stories) para Receitas

Adicionar funcionalidade de upload e exibição de vídeos curtos no formato "story" (9:16) para receitas, permitindo demonstrações visuais do preparo.

## Mudanças

### Backend (Supabase)
- Criar bucket de storage `recipe-videos` para armazenar os arquivos de vídeo.
- Garantir que a coluna `video_url` (já existente no frontend) esteja presente na tabela `recipes`.
- Configurar políticas RLS para o bucket `recipe-videos` (acesso público para leitura, restrito a administradores para escrita).

### Frontend
- **Admin**: Refinar a interface de upload de vídeo em `src/routes/admin.receitas.tsx` para garantir que o bucket correto seja utilizado e os limites de tamanho/tipo sejam validados.
- **StoryPlayer**: Otimizar o componente `src/components/platform/StoryPlayer.tsx` para melhor experiência mobile e carregamento.
- **Listagem de Receitas**: Garantir que o botão de "Play" apareça apenas em receitas que possuem vídeo em `src/routes/app.receitas.tsx`.

## Detalhes Técnicos
- Formato recomendado: Vertical (9:16).
- Armazenamento: Supabase Storage.
- Validação: Apenas arquivos de vídeo, limite sugerido de 50MB.
- Interface: Botão de ação direta sobre a capa da receita para abrir o player.

## Verificação
- [ ] Criar uma nova receita no admin com upload de vídeo.
- [ ] Verificar se o vídeo é carregado corretamente no storage.
- [ ] Acessar como aluno e abrir o StoryPlayer.
- [ ] Testar controles de play/pause e progresso no player.
