# Plano: Controle de Exibição Única do Cupom de Desconto

Este plano visa modificar o comportamento do formulário de cupom de desconto na landing page para que ele seja exibido apenas uma vez por visita (sessão), evitando uma experiência intrusiva.

## Alterações Propostas

### Frontend

- **src/routes/index.tsx**
    - Localizar o componente `LeadPopup`.
    - Garantir que a lógica de "trigger" (gatilho) verifique se o popup já foi exibido nesta sessão.
    - Utilizar `sessionStorage` para persistir o estado de exibição durante a visita atual.
    - O popup continuará sendo acionado por intenção de saída (exit-intent) no desktop e scroll rápido no mobile, mas respeitará a trava de "exibição única".

## Detalhes Técnicos

- **Persistência**: Será utilizada a chave `espetinho_lead_popup_shown` no `sessionStorage`.
- **Lógica de Gatilho**:
    1. O usuário move o mouse para fora (topo) ou faz scroll rápido.
    2. O sistema verifica se `sessionStorage.getItem('espetinho_lead_popup_shown')` é nulo.
    3. Se for nulo, o popup abre e a chave é definida como `'1'`.
    4. Se a chave já existir, o popup não abre novamente, mesmo que o usuário repita o movimento de saída.

## Requisitos Satisfeitos

- [x] Acionamento por "subir rapidamente o mouse" (exit-intent).
- [x] Exibição única por sessão/visita.
- [x] Persistência via Session Storage para evitar reexibição em atualizações de página dentro da mesma sessão.
- [x] Sem impacto na funcionalidade do formulário de cupom.
