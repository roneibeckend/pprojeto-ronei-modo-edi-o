# Plano de Implementação: Autoplay Condicional para Vídeo de Introdução

Este plano descreve como implementar a funcionalidade de reprodução automática do vídeo de introdução apenas na primeira vez que um usuário acessa um ebook ou curso específico. Nas aberturas subsequentes, um botão manual será exibido.

## Mudanças Propostas

### Backend (Banco de Dados)
- Não são necessárias alterações no esquema do banco de dados neste momento, pois utilizaremos o `localStorage` para persistir o estado de "já assistido" por dispositivo/usuário. Isso garante uma resposta imediata sem depender de latência de rede para o autoplay.

### Frontend (Área de Membros)

#### 1. Rota de Ebooks (`src/routes/app.ebooks.$ebookId.tsx`)
- Manter a lógica atual de verificação no `localStorage` para a variável `ebook_opening_${ebook.id}`.
- Refinar o `useEffect` que dispara o `setShowOpeningVideo(true)` para garantir que ele só ocorra se a chave não existir.
- Garantir que o botão "Ver Vídeo Intro" na interface principal permaneça disponível para reprodução manual a qualquer momento.

#### 2. Rota de Cursos (`src/routes/app.cursos.$courseId.tsx`)
- Implementar comportamento idêntico ao de ebooks.
- Adicionar estado `showOpeningVideo` e `showIntroVideo`.
- Adicionar lógica de verificação no `localStorage` usando a chave `course_opening_${course.id}`.
- Adicionar o modal de vídeo de introdução (copiando o padrão de sucesso dos ebooks) para manter a consistência visual.
- Adicionar o botão "Ver Vídeo Intro" no cabeçalho da página do curso, caso o curso possua `intro_video_url`.

#### 3. Componente de Vídeo (`src/components/platform/VideoPlayer.tsx`)
- O componente já possui a prop `isIntro` que tenta o autoplay. Não são necessárias mudanças estruturais, apenas o controle externo via rotas sobre quando montar o componente com `isIntro={true}`.

## Detalhes Técnicos
- **Persistência**: Utilização de `localStorage` com chaves prefixadas por tipo de conteúdo e ID (`ebook_opening_ID`, `course_opening_ID`).
- **Experiência do Usuário (UX)**: 
  - Primeira vez: Modal abre automaticamente com autoplay.
  - Subsequente: Modal não abre, mas um botão "Ver Vídeo Intro" fica disponível no cabeçalho.
- **Consistência**: Alinhamento das funcionalidades entre cursos e ebooks, garantindo que ambos ofereçam a mesma experiência de boas-vindas.

## Próximos Passos
1. Atualizar `src/routes/app.ebooks.$ebookId.tsx` para garantir que o autoplay siga estritamente o `localStorage`.
2. Modificar `src/routes/app.cursos.$courseId.tsx` para incluir o modal de intro e o botão de reprodução manual.
3. Testar a transição entre a primeira visita e as visitas subsequentes em ambos os tipos de conteúdo.
