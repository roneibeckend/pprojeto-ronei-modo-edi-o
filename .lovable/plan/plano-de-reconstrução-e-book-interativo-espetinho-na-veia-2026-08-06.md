# Plano de Reconstrução: E-book Interativo — Espetinho na Veia

Reconstrução da área de membros do e-book para um layout de coluna única centralizada, seguindo o design prêmio "Do Zero aos 10k".

## 1. Auditoria e Preparação
- [ ] Validar a presença do arquivo `/public/welcome-ronnei.mp4` ou configurar fallback para o Storage.
- [ ] Confirmar os tokens semânticos de cores no `src/styles.css` (laranja/fogo/dark).

## 2. Reestruturação da Rota `app.ebooks.$ebookId.tsx`
- [ ] **Remover Sidebar**: Eliminar a estrutura de layout atual (Accordion na lateral) em favor de uma coluna única `max-w-5xl`.
- [ ] **Implementar Hero**:
    - [ ] Logo customizada "ESPETINHO NA VEIA".
    - [ ] Player de vídeo fixo com a legenda "🔥 Boas-vindas do Ronnei".
- [ ] **Barra de Estatísticas**:
    - [ ] Cálculo dinâmico de capítulos totais e concluídos.
    - [ ] UI de 3 colunas com fonte display.
- [ ] **Seção de Progresso**:
    - [ ] Barra de progresso larga com gradiente.
- [ ] **Trilha do Método (Lista de Módulos)**:
    - [ ] Cards verticais com animação Stagger (Framer Motion).
    - [ ] Lógica para identificar o "Próximo Módulo" (badge e `aria-current`).
    - [ ] Estados Visuais: Concluído (opacity-60, check), Próximo (borda acentuada, badge), Pendente (bloqueado/vazio).

## 3. Acessibilidade e Animações
- [ ] Adicionar `aria-label` e `role` adequados.
- [ ] Configurar transições do Framer Motion conforme especificado (250ms, stagger 60ms).

## 4. Validação
- [ ] Testar navegação entre capítulos mantendo o player de vídeo visível se necessário (ou redirecionando para a leitura).
- [ ] Verificar responsividade em dispositivos móveis.
