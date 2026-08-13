# Plano de Reconstrução: Planilhas e Materiais Profissionais

Este plano detalha a reconstrução completa dos materiais da plataforma (XLSX, PDF e material editável) para elevar o nível de profissionalismo, funcionalidade e percepção de valor, conforme solicitado.

## Objetivo
Transformar materiais genéricos em ferramentas profissionais de gestão, com dashboards reais, fórmulas funcionais, identidade visual consistente e dados demonstrativos coerentes.

## Alterações Propostas

### 1. XLSX (Planilhas Profissionais)
Usaremos a biblioteca `exceljs` para gerar arquivos com:
- **Múltiplas abas**: Instruções, Dados, Fichas Técnicas, Custos Fixos e Dashboards.
- **Fórmulas Reais**: Cálculos de custo, lucro, margem e markup diretamente no Excel (recalculáveis pelo usuário).
- **Interface Visual**: Ocultação de gridlines, uso de cards, KPIs destacados, formatação condicional (alertas de estoque baixo/prejuízo) e congelamento de painéis.
- **Padronização de Input**: Fundo amarelo claro para campos editáveis ("Preencha aqui") e cinza claro para campos calculados.
- **Dados Demonstrativos**: Base de dados de 35+ insumos e 18+ produtos coerentes entre si (ex: Alcatra, Frango, Queijo Coalho).

### 2. PDF (Listas e Checklists)
Usaremos `jspdf` para criar documentos com:
- **Design Premium**: Cabeçalhos estilizados com a cor da marca (#FF3427), tipografia clara e estruturada.
- **Funcionalidade**: Listas de compras semanais organizadas por categorias e checklists de equipamentos com seções de produção, preparo e refrigeração.

### 3. Material Editável (Cardápio)
- Instalamos `pptxgenjs` para gerar um arquivo `cardapio-editavel-espetinho.pptx` real.
- O arquivo será compatível com o Canva (importável) e terá todos os elementos (preços, nomes de produtos) como texto editável.

## Escopo Técnico
- **Identidade Visual**: Aplicação rigorosa da paleta de cores (Fundo #F7F4F1, Destaques #FF3427, etc.) em todos os materiais.
- **Robustez**: Implementação de fórmulas defensivas (IFERROR) para evitar erros como `#DIV/0!`.
- **Integração**: Os botões atuais na página `/app/materiais` serão conectados aos novos geradores, sem alterar o layout da página.

## Verificação
- Testar a geração de cada um dos 6 arquivos.
- Abrir os XLSX para validar fórmulas e formatação.
- Validar a legibilidade dos PDFs.
- Confirmar que o PPTX abre corretamente.
