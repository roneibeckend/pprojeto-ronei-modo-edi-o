# Plano de Modernização do Suporte e Integração de Chamados

Este plano visa transformar a experiência de suporte no projeto "Espetinho na Veia", modernizando a interface do chat e adicionando uma funcionalidade robusta de abertura de chamados.

## 1. Modernização do Chat (UI/UX)
- **Visual "Brasa":** Atualizar o chat para um visual mais limpo, com bolhas de mensagem melhor estilizadas, avatares e animações suaves.
- **Interatividade:** Melhorar o estado de "digitando" e adicionar suporte a mensagens rápidas (quick replies).
- **Layout:** Reorganizar a estrutura para que o chat ocupe um lugar de destaque, mas mantenha as FAQs acessíveis de forma elegante.

## 2. Funcionalidade de Chamados (Tickets)
- **Novo Componente de Ticket:** Criar uma aba ou seção específica para "Abrir Chamado".
- **Formulário de Solicitação:** Implementar um formulário com campos para:
  - Assunto
  - Categoria (Financeiro, Técnico, Dúvida de Curso)
  - Mensagem detalhada
  - Prioridade
- **Encaminhamento:** Simular o envio para a "Equipe do Ronnei" com um feedback visual de sucesso e um ID de protocolo.
- **Histórico (Opcional/Visual):** Exibir uma lista simples de chamados abertos para o aluno acompanhar.

## 3. Alterações Técnicas
- **`src/routes/app.suporte.tsx`:** 
  - Refatoração completa da UI.
  - Adição de estado para alternar entre "Chat Inteligente" e "Tickets".
  - Implementação da lógica do formulário de chamados.
- **`src/lib/platform-data.ts`:** (Se necessário) Adicionar tipos ou dados iniciais para categorias de chamados.

## 4. Resultado Esperado
Uma página de suporte que transmita profissionalismo e segurança ao aluno, oferecendo tanto ajuda imediata via assistente (Brasa) quanto suporte humano especializado via tickets.
