# Plano de Implementação: Distribuição de Lucros Automática via Pix (Asaas)

Implementação da automação completa do fluxo de distribuição de lucros, desde o cálculo no painel administrativo até o pagamento real via Pix utilizando a API do Asaas.

## Ações Técnicas
- **Integração Asaas Payout**: Implementação de lógica no servidor para chamadas ao endpoint `/transfers` do Asaas para envios Pix.
- **Detecção de Chave Pix**: Lógica para identificar automaticamente o tipo de chave Pix (CPF, CNPJ, E-mail, Telefone ou Aleatória).
- **Automação de Fluxo**: Atualização da função `adminUpdatePayoutStatus` para disparar o pagamento real quando um saque for marcado como "Pago".
- **Geração Automática de Solicitação**: Ao distribuir lucros no painel financeiro, o sistema agora criará automaticamente uma solicitação de saque aprovada se o sócio tiver uma chave Pix cadastrada.
- **Logs e Rastreabilidade**: Registro de IDs de transferência do Asaas no banco de dados para auditoria.

## Detalhes de Implementação
### 1. Novo Módulo de Payout (Asaas)
Criação de `src/lib/asaas-payouts.server.ts` para isolar a comunicação com a API de transferências do Asaas.

### 2. Evolução de Payout Functions
Refatoração de `src/lib/payouts.functions.ts` para:
- Incluir o middleware de autenticação e verificação de role admin.
- Integrar a chamada de pagamento Pix ao alterar status para 'paid'.
- Implementar a criação de `payout_requests` automática durante a distribuição de lucros.

### 3. Persistência de Dados
- Utilização da coluna `asaas_payment_id` na tabela `payout_requests` para rastrear o comprovante da transação.
- Atualização atômica de saldos via RPCs do banco de dados para garantir integridade.

## Considerações
- O sistema utilizará a chave de API do Asaas já configurada no Centro de Integrações.
- Ambientes de Sandbox e Produção serão respeitados automaticamente conforme a chave configurada.
