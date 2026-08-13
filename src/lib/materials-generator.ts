import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Utility to create professional XLSX files for the platform
 */

const FIRE_COLOR = 'e11d48'; // Primary theme color
const LIGHT_GRAY = 'f3f4f6';

export const generateCostSpreadsheet = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Espetinho na Veia';
  workbook.lastModifiedBy = 'Espetinho na Veia';
  workbook.created = new Date();

  // 1. HOW TO USE SHEET
  const howToUse = workbook.addWorksheet('COMO USAR');
  howToUse.columns = [{ width: 40 }, { width: 80 }];
  
  howToUse.addRow(['COMO USAR ESTA PLANILHA']).font = { bold: true, size: 16, color: { argb: FIRE_COLOR } };
  howToUse.addRow(['ESTA É UMA FERRAMENTA PROFISSIONAL DE GESTÃO PARA SEU NEGÓCIO DE ESPETINHOS.']);
  howToUse.addRow([]);
  
  const instructions = [
    ['1. Cadastro de Insumos', 'Comece pela aba "INSUMOS". Cadastre tudo o que você compra (carnes, carvão, palitos).'],
    ['2. Conversão Automática', 'A planilha converte automaticamente pacotes em gramas/unidades para facilitar o cálculo.'],
    ['3. Fichas Técnicas', 'Na aba "FICHAS TÉCNICAS", monte seus espetinhos selecionando os insumos cadastrados.'],
    ['4. Custos Fixos', 'Informe seus gastos mensais (aluguel, luz) para o cálculo do ponto de equilíbrio.'],
    ['5. Dashboard', 'Acompanhe os resultados visuais e margens de lucro de forma automática.'],
  ];

  instructions.forEach(row => {
    const r = howToUse.addRow(row);
    r.getCell(1).font = { bold: true };
  });

  // 2. INSUMOS SHEET
  const insumos = workbook.addWorksheet('INSUMOS');
  const insumosHeader = [
    'Código', 'Ingrediente', 'Categoria', 'Unidade de Compra', 'Qtd Comprada', 
    'Preço Embalagem (R$)', 'Peso/Vol Total (g/ml)', 'Perda Est. (%)', 'Custo Líquido (R$)', 'Custo Unit (g/ml/un)'
  ];
  
  const headerRow = insumos.addRow(insumosHeader);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FIRE_COLOR } };
  
  insumos.columns = [
    { width: 10 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }, 
    { width: 20 }, { width: 20 }, { width: 15 }, { width: 20 }, { width: 25 }
  ];

  // Sample Data
  const sampleInsumos = [
    ['001', 'Alcatra Bovina', 'Carnes', 'Kg', 1, 45.90, 1000, 10, null, null],
    ['002', 'Peito de Frango', 'Carnes', 'Kg', 1, 22.50, 1000, 5, null, null],
    ['003', 'Palito de Bambu', 'Descartáveis', 'Pacote', 1, 15.00, 100, 0, null, null],
    ['004', 'Sal Grosso', 'Temperos', 'Kg', 1, 4.50, 1000, 0, null, null],
  ];

  sampleInsumos.forEach((data, i) => {
    const rowIdx = i + 2;
    const r = insumos.addRow(data);
    
    // Formula for Custo Líquido (considering loss)
    // Custo Líquido = Preço / (1 - Perda)
    r.getCell(9).value = { formula: `F${rowIdx}/(1-(H${rowIdx}/100))` };
    
    // Formula for Custo Unitário
    // Custo Unit = Custo Líquido / Peso Total
    r.getCell(10).value = { formula: `I${rowIdx}/G${rowIdx}` };
    
    r.getCell(6).numFmt = '"R$ "#,##0.00';
    r.getCell(9).numFmt = '"R$ "#,##0.00';
    r.getCell(10).numFmt = '"R$ "#,##0.0000';
  });

  // 3. FICHAS TÉCNICAS
  const fichas = workbook.addWorksheet('FICHAS TÉCNICAS');
  fichas.addRow(['FICHA TÉCNICA - ESPETINHO BOVINO']).font = { bold: true, size: 14 };
  fichas.addRow([]);
  
  const fichaHeader = ['Ingrediente', 'Quantidade', 'Unidade', 'Custo Unitário (R$)', 'Total (R$)'];
  const fhr = fichas.addRow(fichaHeader);
  fhr.font = { bold: true };
  fhr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEEEEE' } };

  const recipeData = [
    ['Alcatra Bovina', 120, 'g', { formula: 'INSUMOS!J2' }, { formula: 'B4*D4' }],
    ['Sal Grosso', 5, 'g', { formula: 'INSUMOS!J5' }, { formula: 'B5*D5' }],
    ['Palito de Bambu', 1, 'un', { formula: 'INSUMOS!J4' }, { formula: 'B6*D6' }],
  ];

  recipeData.forEach(row => {
    const r = fichas.addRow(row);
    r.getCell(4).numFmt = '"R$ "#,##0.0000';
    r.getCell(5).numFmt = '"R$ "#,##0.00';
  });

  fichas.addRow([]);
  const totalRow = fichas.addRow(['', '', '', 'CUSTO TOTAL INGREDIENTES:', { formula: 'SUM(E4:E6)' }]);
  totalRow.getCell(4).font = { bold: true };
  totalRow.getCell(5).font = { bold: true };
  totalRow.getCell(5).numFmt = '"R$ "#,##0.00';

  // 4. CUSTOS FIXOS
  const custosFixos = workbook.addWorksheet('CUSTOS FIXOS');
  custosFixos.addRow(['CUSTOS FIXOS MENSAIS']).font = { bold: true, size: 14 };
  custosFixos.addRow([]);
  const fixedHeader = ['Descrição', 'Valor Mensal (R$)'];
  custosFixos.addRow(fixedHeader).font = { bold: true };
  
  const sampleFixed = [
    ['Aluguel', 1200],
    ['Energia/Luz', 250],
    ['Água', 80],
    ['Gás/Carvão', 400],
    ['Funcionários', 1500],
  ];
  
  sampleFixed.forEach(d => custosFixos.addRow(d).getCell(2).numFmt = '"R$ "#,##0.00');
  
  const totalFixedRow = custosFixos.addRow(['TOTAL CUSTOS FIXOS:', { formula: 'SUM(B3:B7)' }]);
  totalFixedRow.font = { bold: true };
  totalFixedRow.getCell(2).numFmt = '"R$ "#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'planilha-custos-espetinho.xlsx');
};

export const generatePricingCalculator = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('CALCULADORA');
  
  sheet.columns = [{ width: 30 }, { width: 25 }, { width: 40 }];
  
  sheet.addRow(['CALCULADORA DE PREÇO DE VENDA PROFISSIONAL']).font = { bold: true, size: 16, color: { argb: FIRE_COLOR } };
  sheet.addRow([]);
  
  // Settings Section
  sheet.addRow(['CONFIGURAÇÕES']).font = { bold: true };
  sheet.addRow(['Margem de Lucro Desejada (%)', 40]).getCell(2).numFmt = '0"%"';
  sheet.addRow(['Impostos (%)', 6]).getCell(2).numFmt = '0"%"';
  sheet.addRow(['Taxa de Cartão/App (%)', 12]).getCell(2).numFmt = '0"%"';
  sheet.addRow([]);
  
  // Product Section
  sheet.addRow(['CÁLCULO POR PRODUTO']).font = { bold: true };
  sheet.addRow(['Custo dos Ingredientes (R$)', 4.50]).getCell(2).numFmt = '"R$ "#,##0.00';
  sheet.addRow(['Custo Operacional Estimado (R$)', 1.20]).getCell(2).numFmt = '"R$ "#,##0.00';
  sheet.addRow(['Custo de Embalagem (R$)', 0.50]).getCell(2).numFmt = '"R$ "#,##0.00';
  
  sheet.addRow([]);
  
  // Calculations
  const markupRow = sheet.addRow(['MARKUP CALCULADO', { formula: '1/((100-(B4+B5+B6))/100)' }]);
  markupRow.getCell(2).numFmt = '0.00';
  
  const priceRow = sheet.addRow(['PREÇO DE VENDA SUGERIDO', { formula: '(B9+B10+B11)*B14' }]);
  priceRow.font = { bold: true, size: 12 };
  priceRow.getCell(2).numFmt = '"R$ "#,##0.00';
  priceRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DFF0D8' } };
  
  const profitRow = sheet.addRow(['LUCRO LÍQUIDO ESTIMADO (R$)', { formula: 'B15 * (B4/100)' }]);
  profitRow.getCell(2).numFmt = '"R$ "#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'calculadora-preco-espetinho.xlsx');
};

export const generateInventoryControl = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ESTOQUE');
  
  const headers = ['Item', 'Categoria', 'Estoque Mínimo', 'Estoque Atual', 'Unidade', 'Status'];
  const hr = sheet.addRow(headers);
  hr.font = { bold: true, color: { argb: 'FFFFFF' } };
  hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FIRE_COLOR } };
  
  sheet.columns = [
    { width: 30 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 10 }, { width: 20 }
  ];

  const data = [
    ['Contra Filé', 'Carnes', 10, 5, 'Kg', null],
    ['Carvão 4kg', 'Insumos', 5, 12, 'Saco', null],
    ['Cerveja Lata', 'Bebidas', 48, 24, 'Un', null],
    ['Arroz 5kg', 'Acompanhamentos', 2, 1, 'Pacote', null],
  ];

  data.forEach((row, i) => {
    const idx = i + 2;
    const r = sheet.addRow(row);
    r.getCell(6).value = { 
      formula: `IF(D${idx} < C${idx}, "🔴 REPOR URGENTE", IF(D${idx} < C${idx}*1.5, "🟡 ESTOQUE BAIXO", "🟢 OK"))` 
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'controle-estoque-espetinho.xlsx');
};
