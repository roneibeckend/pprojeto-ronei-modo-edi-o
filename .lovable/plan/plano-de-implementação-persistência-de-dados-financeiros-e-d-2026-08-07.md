# Plano de Implementação: Persistência de Dados Financeiros e Divisão de Sócios

O objetivo deste plano é implementar o salvamento permanente das alterações feitas no painel financeiro, incluindo a receita simulada, custos operacionais e a divisão de porcentagens entre os sócios.

## 1. Infraestrutura de Dados
Já foram criadas as seguintes tabelas no banco de dados para suportar a persistência:
- `financial_settings`: Armazena a receita manual simulada.
- `financial_costs`: Armazena a lista de custos (descrição e valor).
- `financial_partners`: Armazena a lista de sócios (nome e porcentagem).

As políticas de RLS (Row Level Security) e permissões de acesso já foram configuradas para garantir que apenas administradores possam gerenciar esses dados.

## 2. Alterações no Frontend (src/routes/admin.financeiro.tsx)
O componente será refatorado para utilizar o `tanstack/react-query` para gerenciamento de estado assíncrono:

- **Carregamento de Dados:** Utilização de `useQuery` para buscar os dados das três tabelas ao carregar a página.
- **Estado Local:** Os estados de `revenue`, `costs` e `partners` serão inicializados com os dados do banco, mas permanecerão editáveis localmente para permitir simulações antes do salvamento.
- **Botão de Salvamento:** Será adicionado um botão "Salvar Configurações" no cabeçalho ou rodapé da página.
- **Lógica de Persistência:** Implementação de uma `mutation` que realiza o seguinte fluxo ao clicar em "Salvar":
    1. Atualiza a receita na tabela `financial_settings`.
    2. Deleta os custos antigos e insere os novos na tabela `financial_costs` (abordagem replace-all para simplicidade e consistência).
    3. Deleta os sócios antigos e insere os novos na tabela `financial_partners`.
    4. Exibe um `toast` de sucesso ou erro.

## 3. Validação
- Verificar se os dados persistidos são recarregados corretamente ao atualizar a página.
- Garantir que a soma das porcentagens dos sócios continue sendo validada (exibindo alerta se diferente de 100%).
- Validar se o botão de salvamento está acessível e funcional.
