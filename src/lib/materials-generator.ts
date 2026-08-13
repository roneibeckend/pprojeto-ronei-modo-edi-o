import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BRAND_COLORS, DEMO_INSUMOS, DEMO_PRODUCTS, DEMO_FIXED_COSTS } from './materials-data';

/**
 * Utility to create professional XLSX files for the platform
 */

const setupProfessionalStyles = (workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet) => {
  sheet.views = [{ showGridLines: false }];
  
  // Freeze Panes for data sheets
  if (sheet.name === 'INSUMOS' || sheet.name === 'FICHAS TÉCNICAS' || sheet.name === 'ESTOQUE') {
    sheet.views = [{ showGridLines: false, state: 'frozen', ySplit: 5 }];
  }
};

const addHeader = (sheet: ExcelJS.Worksheet, title: string, subtitle: string) => {
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 24, color: { argb: BRAND_COLORS.red }, name: 'Aptos' };
  
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.value = subtitle;
  subtitleCell.font = { size: 14, color: { argb: BRAND_COLORS.gray }, name: 'Aptos' };

  const infoCell = sheet.getCell('A3');
  infoCell.value = 'DADOS DE EXEMPLO — substitua pelos dados do seu negócio.';
  infoCell.font = { italic: true, size: 10, color: { argb: BRAND_COLORS.orange }, name: 'Aptos' };
};

const applyBorder = (cell: ExcelJS.Cell) => {
  cell.border = {
    top: { style: 'thin', color: { argb: 'E0E0E0' } },
    left: { style: 'thin', color: { argb: 'E0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
    right: { style: 'thin', color: { argb: 'E0E0E0' } }
  };
};

export const generateCostSpreadsheet = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espetinho do Ronnei';
  
  // 1. COMO USAR
  const howToUse = workbook.addWorksheet('COMO USAR');
  setupProfessionalStyles(workbook, howToUse);
  addHeader(howToUse, 'GUIA DE USO', 'Ferramenta de Gestão de Custos - Espetinho do Ronnei');
  
  howToUse.getColumn(1).width = 40;
  howToUse.getColumn(2).width = 80;

  const steps = [
    ['ETAPA', 'DESCRIÇÃO'],
    ['1. Cadastro de Insumos', 'Vá para a aba "INSUMOS" e cadastre tudo o que você compra. Informe o preço pago e a perda estimada.'],
    ['2. Custos Fixos', 'Na aba "CUSTOS FIXOS", liste seus gastos mensais (aluguel, luz, funcionários).'],
    ['3. Fichas Técnicas', 'Na aba "FICHAS TÉCNICAS", defina a composição de cada produto para saber o custo real de produção.'],
    ['4. Dashboard', 'Visualize a saúde financeira e o ponto de equilíbrio de forma automática.'],
    [],
    ['LEGENDA DE CORES', ''],
    ['Campos Amarelos', 'Preencha aqui (Entrada de dados)'],
    ['Campos Cinzas', 'Calculado automaticamente (Não alterar)'],
  ];

  steps.forEach((row, i) => {
    const r = howToUse.addRow(row);
    r.font = { name: 'Aptos' };
    if (i === 0) {
      r.font = { bold: true, color: { argb: 'FFFFFF' } };
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.darkGray } };
    }
    if (row[0] === 'Campos Amarelos') r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.inputBg } };
    if (row[0] === 'Campos Cinzas') r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.autoBg } };
  });

  // 2. INSUMOS
  const insumos = workbook.addWorksheet('INSUMOS');
  setupProfessionalStyles(workbook, insumos);
  addHeader(insumos, 'CADASTRO DE INSUMOS', 'Gerencie seus ingredientes e materiais de apoio');
  
  const headers = ['CÓDIGO', 'ITEM', 'CATEGORIA', 'UNIDADE', 'QTD EMBALAGEM', 'PREÇO PAGO (R$)', 'PESO/VOL TOTAL (g/ml)', 'PERDA EST. (%)', 'CUSTO LÍQUIDO (R$)', 'CUSTO UNIT (g/ml/un)'];
  const headerRow = insumos.addRow(headers);
  headerRow.height = 30;
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.red } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  insumos.columns = [
    { width: 10 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 15 },
    { width: 20 }, { width: 20 }, { width: 15 }, { width: 20 }, { width: 20 }
  ];

  DEMO_INSUMOS.forEach((item, i) => {
    const rowIdx = i + 6; // Start after headers and offset
    const row = insumos.addRow([
      item.id, item.name, item.category, item.unit, item.buyQty, item.price, item.weight, item.loss, null, null
    ]);

    row.eachCell((cell, colIdx) => {
      applyBorder(cell);
      cell.font = { name: 'Aptos', size: 10 };
      // Styling inputs vs autos
      if (colIdx <= 8) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.inputBg } };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.autoBg } };
      }
    });

    // Fórmulas Defensivas
    // Custo Líquido = Preço / (1 - Perda)
    row.getCell(9).value = { formula: `IFERROR(F${rowIdx}/(1-(H${rowIdx}/100)), "—")` };
    // Custo Unitário = Custo Líquido / (Qtd * Peso)
    row.getCell(10).value = { formula: `IFERROR(I${rowIdx}/(E${rowIdx}*G${rowIdx}), "—")` };

    row.getCell(6).numFmt = '"R$ "#,##0.00';
    row.getCell(9).numFmt = '"R$ "#,##0.00';
    row.getCell(10).numFmt = '"R$ "#,##0.0000';
  });

  // 3. CUSTOS FIXOS
  const custosFixos = workbook.addWorksheet('CUSTOS FIXOS');
  setupProfessionalStyles(workbook, custosFixos);
  addHeader(custosFixos, 'CUSTOS FIXOS MENSAIS', 'Gastos invariáveis que seu negócio precisa cobrir todo mês');

  const cfHeaders = ['DESCRIÇÃO', 'VALOR MENSAL (R$)'];
  const cfHr = custosFixos.addRow(cfHeaders);
  cfHr.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.darkGray } };
  });

  custosFixos.getColumn(1).width = 40;
  custosFixos.getColumn(2).width = 25;

  DEMO_FIXED_COSTS.forEach(cf => {
    const row = custosFixos.addRow([cf.description, cf.value]);
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.inputBg } };
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.inputBg } };
    row.getCell(2).numFmt = '"R$ "#,##0.00';
    applyBorder(row.getCell(1));
    applyBorder(row.getCell(2));
  });

  const totalRow = custosFixos.addRow(['TOTAL CUSTOS FIXOS', { formula: 'SUM(B5:B25)' }]);
  totalRow.font = { bold: true };
  totalRow.getCell(2).numFmt = '"R$ "#,##0.00';
  totalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.autoBg } };

  // 4. FICHAS TÉCNICAS (Simplified example for demonstration)
  const fichas = workbook.addWorksheet('FICHAS TÉCNICAS');
  setupProfessionalStyles(workbook, fichas);
  addHeader(fichas, 'FICHAS TÉCNICAS', 'Custo detalhado por produto vendido');

  fichas.getColumn(1).width = 30;
  fichas.getColumn(2).width = 15;
  fichas.getColumn(3).width = 15;
  fichas.getColumn(4).width = 20;
  fichas.getColumn(5).width = 20;

  let currentY = 5;
  DEMO_PRODUCTS.slice(0, 5).forEach(prod => {
    const titleRow = fichas.addRow([prod.name.toUpperCase()]);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: BRAND_COLORS.red } };
    
    const hRow = fichas.addRow(['INGREDIENTE', 'QTD', 'UNIDADE', 'CUSTO UNIT (R$)', 'TOTAL (R$)']);
    hRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.gray } };
    });

    prod.ingredients.forEach(ing => {
      // Find index of ingredient in INSUMOS sheet for formula
      const insumoIdx = DEMO_INSUMOS.findIndex(i => i.id === ing.id);
      const formulaRow = insumoIdx + 6;
      const insumo = DEMO_INSUMOS[insumoIdx];

      const r = fichas.addRow([
        insumo.name, 
        ing.qty, 
        insumo.unit === 'Kg' ? 'g' : (insumo.unit === 'Garrafa' ? 'ml' : 'un'),
        { formula: `INSUMOS!J${formulaRow}` },
        { formula: `B${fichas.rowCount}*D${fichas.rowCount}` }
      ]);
      r.getCell(4).numFmt = '"R$ "#,##0.0000';
      r.getCell(5).numFmt = '"R$ "#,##0.00';
    });

    const totalProdRow = fichas.addRow(['', '', '', 'CUSTO TOTAL:', { formula: `SUM(E${fichas.rowCount - prod.ingredients.length + 1}:E${fichas.rowCount})` }]);
    totalProdRow.getCell(4).font = { bold: true };
    totalProdRow.getCell(5).font = { bold: true };
    totalProdRow.getCell(5).numFmt = '"R$ "#,##0.00';
    fichas.addRow([]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'planilha-custos-espetinho.xlsx');
};

export const generatePricingCalculator = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('CALCULADORA');
  setupProfessionalStyles(workbook, sheet);
  addHeader(sheet, 'CALCULADORA DE PRECIFICAÇÃO', 'Encontre o preço de venda ideal com base em suas margens');

  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 25;
  sheet.getColumn(3).width = 50;

  const sections = [
    { title: '1. PREMISSAS DE VENDA', items: [
      ['Margem de Lucro Desejada (%)', 45, 'Quanto você quer que sobre livre no bolso'],
      ['Impostos / DAS (%)', 6, 'Percentual do seu regime tributário'],
      ['Comissão / Taxas Apps (%)', 12, 'Taxas de iFood, Rappi ou cartões'],
      ['Fundo de Reserva / Investimento (%)', 5, 'Para manutenção e crescimento']
    ]},
    { title: '2. CUSTO DO PRODUTO', items: [
      ['Custo dos Ingredientes (R$)', 4.85, 'Busque o total na sua Ficha Técnica'],
      ['Embalagens e Descartáveis (R$)', 0.95, 'Sacos, marmitas, guardanapos'],
      ['Custo Operacional Variável (R$)', 1.50, 'Carvão, gás, entrega por unidade']
    ]}
  ];

  let currentY = 5;
  sections.forEach(sec => {
    const head = sheet.addRow([sec.title]);
    head.font = { bold: true, color: { argb: BRAND_COLORS.red } };
    
    sec.items.forEach(item => {
      const r = sheet.addRow([item[0], item[1], item[2]]);
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.inputBg } };
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.inputBg } };
      r.getCell(3).font = { size: 9, color: { argb: BRAND_COLORS.gray } };
      
      if (String(item[0]).includes('%')) r.getCell(2).numFmt = '0"%"';
      else r.getCell(2).numFmt = '"R$ "#,##0.00';
      applyBorder(r.getCell(1));
      applyBorder(r.getCell(2));
    });
    sheet.addRow([]);
  });

  const calcHead = sheet.addRow(['3. RESULTADOS CALCULADOS']);
  calcHead.font = { bold: true, color: { argb: BRAND_COLORS.red } };

  const markupRow = sheet.addRow(['MARKUP (Multiplicador)', { formula: 'IFERROR(1/((100-(B6+B7+B8+B9))/100), "—")' }]);
  markupRow.getCell(2).numFmt = '0.00';

  sheet.addRow([]);
  const suggestedPrice = sheet.addRow(['PREÇO DE VENDA SUGERIDO', { formula: 'IFERROR((B12+B13+B14)*B17, "—")' }]);
  suggestedPrice.height = 35;
  suggestedPrice.getCell(1).font = { bold: true, size: 14 };
  suggestedPrice.getCell(2).font = { bold: true, size: 18, color: { argb: BRAND_COLORS.green } };
  suggestedPrice.getCell(2).numFmt = '"R$ "#,##0.00';
  suggestedPrice.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DFF0D8' } };

  sheet.addRow([]);
  const profitRow = sheet.addRow(['LUCRO LÍQUIDO ESTIMADO (R$)', { formula: 'IFERROR(B19 * (B6/100), "—")' }]);
  profitRow.getCell(2).font = { bold: true };
  profitRow.getCell(2).numFmt = '"R$ "#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'calculadora-preco-venda.xlsx');
};

export const generateInventoryControl = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ESTOQUE');
  setupProfessionalStyles(workbook, sheet);
  addHeader(sheet, 'CONTROLE DE ESTOQUE INTELIGENTE', 'Acompanhe suas quantidades e nunca deixe faltar nada');

  const headers = ['ITEM', 'CATEGORIA', 'UNIDADE', 'ESTOQUE MÍNIMO', 'ESTOQUE ATUAL', 'VALOR UNIT (R$)', 'VALOR TOTAL (R$)', 'STATUS'];
  const hr = sheet.addRow(headers);
  hr.height = 25;
  hr.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.red } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  sheet.columns = [
    { width: 30 }, { width: 15 }, { width: 10 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 25 }
  ];

  const stockData = DEMO_INSUMOS.map((item, i) => {
    // Generate some random realistic stock levels
    const min = Math.ceil(item.buyQty * 5);
    let current = Math.floor(Math.random() * (min * 3));
    
    // Force some "Reposição Urgente" situations
    if (i === 0 || i === 12) current = min - 2;
    
    return [item.name, item.category, item.unit, min, current, (item.price/item.weight), null, null];
  });

  stockData.forEach((row, i) => {
    const rowIdx = i + 6;
    const r = sheet.addRow(row);
    
    r.eachCell((cell, colIdx) => {
      applyBorder(cell);
      if (colIdx === 4 || colIdx === 5) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.inputBg } };
      else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.autoBg } };
    });

    r.getCell(6).numFmt = '"R$ "#,##0.00';
    r.getCell(7).value = { formula: `E${rowIdx}*F${rowIdx}` };
    r.getCell(7).numFmt = '"R$ "#,##0.00';

    // Status Formula with conditional icons/colors via simple text for compatibility
    r.getCell(8).value = { 
      formula: `IF(E${rowIdx} < D${rowIdx}, "🚨 REPOSIÇÃO URGENTE", IF(E${rowIdx} < D${rowIdx}*1.5, "⚠️ ESTOQUE BAIXO", "✅ SAUDÁVEL"))` 
    };

    // Conditional formatting (simulated via manual check for demo data or left for user)
    const estoqueMinimo = Number(row[3]) || 0;
    const estoqueAtual = Number(row[4]) || 0;
    if (estoqueAtual < estoqueMinimo) {
       r.getCell(8).font = { color: { argb: BRAND_COLORS.critical }, bold: true };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'controle-estoque-espetinho.xlsx');
};
