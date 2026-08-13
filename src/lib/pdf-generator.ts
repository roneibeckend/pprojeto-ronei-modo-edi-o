import { jsPDF } from 'jspdf';
import { BRAND_COLORS } from './materials-data';

/**
 * Utility to create professional PDF materials
 */

const addPDFHeader = (doc: jsPDF, title: string, subtitle: string) => {
  // Bg Header
  doc.setFillColor(255, 52, 39); // BRAND_COLORS.red
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(title, 105, 22, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle, 105, 32, { align: 'center' });
  doc.text('FERRAMENTAS DE GESTÃO - ESPETINHO DO RONNEI', 105, 38, { align: 'center' });
};

export const generateShoppingListPDF = () => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'LISTA DE COMPRAS SEMANAL', 'Planeje sua produção e controle seus gastos');
  
  doc.setTextColor(23, 19, 17); // BRAND_COLORS.black
  
  let y = 60;
  
  const categories = [
    { name: 'CARNES E PROTEÍNAS', items: ['Alcatra Bovina', 'Contrafilé', 'Coxão Mole', 'Peito de Frango', 'Sobrecoxa', 'Coração de Frango', 'Linguiça Toscana', 'Bacon Defumado', 'Carne para Kafta', 'Queijo Coalho'] },
    { name: 'HORTIFRUTI', items: ['Cebola Branca', 'Tomate Italiano', 'Pimentão Verde', 'Alho Roxo', 'Cheiro-Verde', 'Limão Taiti', 'Mandioca', 'Repolho'] },
    { name: 'MERCEARIA E TEMPEROS', items: ['Sal Grosso', 'Óleo de Soja', 'Vinagre de Álcool', 'Farinha de Mandioca', 'Arroz Agulhinha', 'Feijão Fradinho', 'Pimenta do Reino'] },
    { name: 'CONDIMENTOS', items: ['Molho de Alho', 'Ketchup', 'Maionese', 'Mostarda', 'Molho Inglês'] },
    { name: 'DESCARTÁVEIS E EMBALAGENS', items: ['Palitos de Bambu', 'Guardanapos', 'Marmitas Isopor', 'Sacolas Plásticas', 'Papel Alumínio', 'Filme PVC'] },
    { name: 'OUTROS', items: ['Carvão Vegetal', 'Gelo', 'Detergente', 'Água Sanitária'] },
  ];
  
  categories.forEach(cat => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 52, 39);
    doc.text(cat.name, 20, y);
    doc.setDrawColor(238, 233, 229); // BRAND_COLORS.lightGray
    doc.line(20, y + 2, 190, y + 2);
    y += 12;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(23, 19, 17);
    
    cat.items.forEach(item => {
      doc.setDrawColor(117, 107, 101); // BRAND_COLORS.gray
      doc.rect(20, y - 4, 4, 4); // Checkbox
      doc.text(item, 28, y);
      
      doc.setFontSize(8);
      doc.setTextColor(117, 107, 101);
      doc.text('QTD: _________   UNIT: _________   TOTAL: _________', 115, y);
      
      doc.setFontSize(11);
      doc.setTextColor(23, 19, 17);
      y += 9;
    });
    
    y += 6;
  });
  
  doc.save('lista-compras-semanal.pdf');
};

export const generateEquipmentChecklistPDF = () => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'CHECKLIST DE EQUIPAMENTOS', 'Estrutura necessária para um negócio profissional');
  
  doc.setTextColor(23, 19, 17);
  let y = 60;
  
  const sections = [
    { title: 'PRODUÇÃO E COZIMENTO', items: ['Churrasqueira em Inox (Mín. 1 metro)', 'Grelhas Reforçadas', 'Exaustor Industrial', 'Bancada de Apoio em Inox', 'Pás e Atiçadores de Brasa'] },
    { title: 'PREPARO E CORTE', items: ['Facas Profissionais (Desossa/Corte)', 'Tábuas de Polietileno (Cores por tipo)', 'Amolador/Chaira Profissional', 'Processador de Alimentos', 'Balança Digital (Até 10kg)', 'Recipientes Plásticos com Vedação'] },
    { title: 'REFRIGERAÇÃO', items: ['Freezer Horizontal (Estoque)', 'Geladeira Comercial (Bebidas)', 'Expositor Vertical', 'Caixas Térmicas para Eventos', 'Termômetro Laser/Espeto'] },
    { title: 'OPERAÇÃO E HIGIENE', items: ['Sistema de Gestão/PDV', 'Impressora Térmica', 'Uniforme e Aventais', 'Toucas e Luvas Descartáveis', 'Lixeiras com Pedal (Norma Sanitária)'] },
    { title: 'SALÃO E ATENDIMENTO', items: ['Mesas e Cadeiras', 'Placa de Cardápio/Lousa', 'Suportes para Guardanapo', 'Iluminação Decorativa', 'Sistema de Som Ambiente'] },
  ];
  
  sections.forEach(group => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 52, 39);
    doc.text(group.title, 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 12;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(23, 19, 17);
    
    group.items.forEach(item => {
      doc.setDrawColor(117, 107, 101);
      doc.rect(20, y - 4, 4, 4);
      doc.text(item, 28, y);
      
      doc.setFontSize(9);
      doc.setTextColor(117, 107, 101);
      doc.text('[ ] OK   [ ] PRECISO COMPRAR', 145, y);
      
      doc.setFontSize(11);
      doc.setTextColor(23, 19, 17);
      y += 9;
    });
    y += 6;
  });
  
  doc.save('checklist-equipamentos-espetinho.pdf');
};
