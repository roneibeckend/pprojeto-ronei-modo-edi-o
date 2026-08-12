# Plano de Adaptação de E-book para Normas ABNT e Responsividade

Este plano detalha as alterações necessárias para transformar o visual do leitor de e-books em uma experiência profissional e acadêmica, seguindo as normas da ABNT para apresentação de textos.

## Objetivo
Adaptar a formatação do corpo do texto, títulos e subtítulos dos e-books para o padrão ABNT (parágrafos, espaçamento, alinhamento) e garantir que a leitura seja agradável em qualquer dispositivo.

## Alterações Propostas

### 1. Estilização do Corpo do Texto (ABNT)
- **Recuo de Parágrafo:** Aplicar um recuo de `1.25cm` na primeira linha de cada parágrafo do corpo do texto.
- **Espaçamento entre Linhas:** Definir o espaçamento de `1.5` para garantir legibilidade acadêmica.
- **Alinhamento Justificado:** Garantir que todo o texto do e-book esteja justificado.
- **Cor e Contraste:** Ajustar sutilmente a cor do texto para um "quase branco" (ex: `text-white/90`) para evitar fadiga ocular em telas escuras, mantendo o tom premium.

### 2. Hierarquia de Títulos e Subtítulos
- **Títulos de Seção (h1/h2):** Maior destaque, negrito (font-black), margem superior generosa.
- **Subtítulos (h3/h4):** Negrito, destaque visual claro mas inferior aos títulos principais.
- **Consistência Visual:** Utilizar a fonte de exibição (`Oswald`) para títulos e a fonte sans (`Inter`) para o corpo.

### 3. Responsividade e Ajustes de Layout
- **Ajuste Mobile:** Em telas pequenas, o recuo de parágrafo será reduzido proporcionalmente ou removido se prejudicar a leitura em larguras muito estreitas.
- **Padding Dinâmico:** Garantir que o conteúdo não encoste nas bordas em dispositivos móveis.
- **Tratamento de Imagens e Tabelas:** Garantir que elementos multimídia não quebrem o layout justificado.

## Detalhes Técnicos
- **Arquivo Alvo:** `src/routes/app.ebooks.$ebookId.tsx`
- **Técnica:** Utilização de seletores CSS "arbitrary" do Tailwind (ex: `[&_p]:indent-[1.25cm]`) para injetar os estilos no HTML dinâmico proveniente do banco de dados (CKEditor content).
- **Tipografia:** Aplicação da classe `.prose` do Tailwind com extensões personalizadas para atender aos requisitos ABNT.

## Verificação
1. Abrir um e-book existente e verificar se os parágrafos possuem o recuo de 1.25cm.
2. Validar o espaçamento de 1.5 e o alinhamento justificado.
3. Testar a visualização em resoluções de Desktop, Tablet e Smartphone.
4. Confirmar que a hierarquia de títulos está nítida.
