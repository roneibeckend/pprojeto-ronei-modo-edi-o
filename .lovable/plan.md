# Plano de Implementação - Painel Administrativo Premium

O painel administrativo foi estruturado para ser a central de comando da operação "Espetinho na Veia", integrando dados financeiros, operacionais e pedagógicos.

## 1. Dashboard de KPIs (Cockpit)
- **Faturamento Total**: Exibição em tempo real com indicador de crescimento.
- **Métricas de Engajamento**: Alunos matriculados, ativos agora e conclusão média.
- **Gráficos Dinâmicos**: Visualização de alunos ativos por período (6/12 meses).

## 2. Painel Financeiro de Sócios
- **Gestão de Custos**: Tabela editável para cadastrar custos fixos e variáveis (Tráfego, Taxas, Equipe).
- **Divisão de Lucro**:
    - Possibilidade de adicionar e remover sócios.
    - Definição de participação percentual (%) por sócio.
    - Cálculo automático do lucro líquido e da parte correspondente a cada sócio em Reais (BRL).
- **Margem Líquida**: Monitoramento constante da saúde financeira.

## 3. Gestão Analítica de Alunos
- **Tabela de Acompanhamento**: Listagem detalhada com nome, e-mail e curso atual.
- **Progresso Individual**: Visualização em barra de progresso do quanto cada aluno já consumiu do conteúdo.

## 4. Próximos Passos (Sugestão)
- **Integração Real**: Conectar os campos editáveis (Custos/Sócios) a uma tabela no banco de dados para persistência.
- **Filtros Avançados**: Implementar seleção de data real (Date Picker) para os gráficos.
