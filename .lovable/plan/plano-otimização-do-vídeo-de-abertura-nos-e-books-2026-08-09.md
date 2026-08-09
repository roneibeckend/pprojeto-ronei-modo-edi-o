# Plano: Otimização do Vídeo de Abertura nos E-books

O objetivo é transformar o "Vídeo de Abertura" de um elemento intrusivo em uma ferramenta de boas-vindas inteligente e opcional, melhorando a experiência do aluno e a flexibilidade para o autor.

## Estratégia de Implementação

### 1. Persistência Inteligente
- **Mudança para LocalStorage**: O status de "visto" do vídeo será movido de `sessionStorage` para `localStorage`. Isso garante que, uma vez que o aluno assista ou pule o vídeo, ele não será importunado novamente em futuras sessões no mesmo dispositivo.

### 2. Acesso On-Demand
- **Botão de Reprise na Sidebar**: Adicionaremos um botão destacado no topo do índice de conteúdos do e-book chamado "Vídeo de Abertura".
- **Benefício**: O aluno pode revisitar a introdução a qualquer momento, e novos alunos que pularam inicialmente podem assistir quando se sentirem prontos.

### 3. Melhoria no Modal de Boas-Vindas
- **Clareza de Ação**: O modal terá botões claros para "Pular" ou "Começar Leitura", tratando o vídeo como uma introdução opcional mas recomendada.
- **Contexto Visual**: O modal exibirá o título do e-book e um selo de "Vídeo de Boas-vindas", criando uma recepção calorosa.

### 4. Alternativas Consideradas (Descrição para o Usuário)
- **Vídeo como Capítulo Zero**: Uma alternativa seria colocar o vídeo como o primeiro capítulo obrigatório. No entanto, a solução de Modal + Sidebar é superior pois não bloqueia a navegação imediata se o aluno estiver com pressa.
- **Picture-in-Picture automático**: Iniciar o vídeo em um player flutuante no canto da tela enquanto o aluno começa a ler. (Pode ser implementado futuramente se houver demanda por multitarefa).

## Validação
- Entrar no e-book pela primeira vez: O vídeo deve aparecer automaticamente.
- Clicar em "Pular" ou "Começar Leitura": O vídeo deve fechar e não aparecer novamente ao recarregar a página ou reabrir o navegador.
- Clicar no botão "Vídeo de Abertura" na sidebar: O vídeo deve reabrir conforme solicitado.
