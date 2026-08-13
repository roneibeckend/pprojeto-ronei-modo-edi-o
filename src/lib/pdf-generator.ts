import { jsPDF } from 'jspdf';

/**
 * Utility to create professional PDF materials
 */

const BRAND_RED = '#e11d48';

export const generateShoppingListPDF = () => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(225, 29, 72); // e11d48
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('LISTA DE COMPRAS SEMANAL', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text('ESPETINHO NA VEIA - GESTÃO PROFISSIONAL', 105, 30, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  let y = 50;
  
  const categories = [
    { name: 'CARNES', items: ['Contra Filé', 'Alcatra', 'Coxão Mole', 'Sobrecoxa de Frango', 'Coração', 'Linguiça Toscada', 'Panceta'] },
    { name: 'HORTIFRUTI', items: ['Cebola', 'Tomate', 'Pimentão', 'Alho', 'Cheiro Verde', 'Limão', 'Repolho'] },
    { name: 'MERCEARIA', items: ['Sal Grosso', 'Óleo', 'Vinagre', 'Farofa Pronta', 'Arroz', 'Feijão Fradinho'] },
    { name: 'DESCARTÁVEIS', items: ['Palitos de Madeira', 'Guardanapos', 'Sacos para Viagem', 'Papel Alumínio', 'Filme PVC'] },
    { name: 'BEBIDAS', items: ['Cerveja', 'Refrigerante 350ml', 'Refrigerante 2L', 'Água Mineral', 'Suco'] },
  ];
  
  categories.forEach(cat => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(cat.name, 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    cat.items.forEach(item => {
      doc.rect(20, y - 4, 4, 4); // Checkbox
      doc.text(item, 30, y);
      doc.text('_______', 160, y); // Quantity line
      y += 8;
    });
    
    y += 5;
  });
  
  doc.save('lista-compras-semanal.pdf');
};

export const generateEquipmentChecklistPDF = () => {
  const doc = new jsPDF();
  
  doc.setFillColor(225, 29, 72);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('CHECKLIST DE EQUIPAMENTOS', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text('PARA MONTAR SEU NEGÓCIO DE ESPETINHO', 105, 30, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  let y = 55;
  
  const equipment = [
    { section: 'PRODUÇÃO', items: ['Churrasqueira de Aço Inox', 'Grelhas Reforçadas', 'Exaustor (se for local fechado)', 'Balcão de Atendimento', 'Mesas e Cadeiras'] },
    { section: 'PREPARO', items: ['Tábuas de Polietileno (Cores diferentes)', 'Facas Profissionais (Corte/Desossa)', 'Amolador de Facas', 'Recipientes Plásticos com Tampa', 'Processador de Alimentos'] },
    { section: 'REFRIGERAÇÃO', items: ['Freezer Horizontal ou Vertical', 'Geladeira Comercial', 'Caixa Térmica (para transporte)', 'Termômetro Digital de Espeto'] },
    { section: 'DIVERSOS', items: ['Uniforme/Avental', 'Toucas e Luvas', 'Sistema de Som', 'Placa de Cardápio', 'Lixeiras com Pedal'] },
  ];
  
  equipment.forEach(group => {
    doc.setFont('helvetica', 'bold');
    doc.text(group.section, 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    group.items.forEach(item => {
      doc.rect(20, y - 4, 4, 4);
      doc.text(item, 30, y);
      y += 8;
    });
    y += 5;
  });
  
  doc.save('checklist-equipamentos.pdf');
};
