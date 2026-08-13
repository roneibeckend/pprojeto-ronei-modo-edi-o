import PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS } from './materials-data';

/**
 * Generates a professional editable menu in PPTX format
 * Compatible with Canva import.
 */

export const generateEditableMenuPPTX = async () => {
  const pptx = new PptxGenJS();
  
  pptx.layout = 'LAYOUT_WIDE'; // 16:9 for Canva compatibility
  
  // Define Slide Master for consistent branding
  pptx.defineSlideMaster({
    title: 'MENU_MASTER',
    background: { color: BRAND_COLORS.bg },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 1, fill: { color: BRAND_COLORS.red } } },
      { text: { text: 'ESPETINHO DO RONNEI', options: { x: 0.5, y: 0.2, w: 5, h: 0.5, fontSize: 24, bold: true, color: BRAND_COLORS.white, fontFace: 'Aptos' } } }
    ]
  });

  // Slide 1: Main Menu
  const slide1 = pptx.addSlide({ masterName: 'MENU_MASTER' });

  slide1.addText('CARDÁPIO PROFISSIONAL', { x: 0.5, y: 1.2, w: '90%', h: 0.8, fontSize: 36, bold: true, color: BRAND_COLORS.black, align: 'center' });
  slide1.addText('Sabor e Qualidade em cada Espeto', { x: 0.5, y: 1.8, w: '90%', h: 0.4, fontSize: 16, italic: true, color: BRAND_COLORS.gray, align: 'center' });

  // Columns for items
  const leftColX = 0.5;
  const rightColX = 5.5;
  let currentY = 2.5;

  const menuItems = [
    { name: 'Espetinho Bovino', price: 'R$ 12,00' },
    { name: 'Espetinho de Frango', price: 'R$ 10,00' },
    { name: 'Frango com Bacon', price: 'R$ 13,00' },
    { name: 'Espetinho de Linguiça', price: 'R$ 9,00' },
    { name: 'Queijo Coalho', price: 'R$ 11,00' },
    { name: 'Pão de Alho Especial', price: 'R$ 8,00' },
  ];

  menuItems.forEach((item, index) => {
    const x = index < 3 ? leftColX : rightColX;
    const y = currentY + (index % 3) * 1.2;

    slide1.addText(item.name.toUpperCase(), { 
      x: x, y: y, w: 4, h: 0.4, 
      fontSize: 18, bold: true, color: BRAND_COLORS.red 
    });
    
    slide1.addText('Descrição do produto aqui. Ingredientes frescos e selecionados.', { 
      x: x, y: y + 0.3, w: 3.5, h: 0.4, 
      fontSize: 11, color: BRAND_COLORS.gray 
    });

    slide1.addText(item.price, { 
      x: x + 3.5, y: y, w: 1, h: 0.4, 
      fontSize: 18, bold: true, color: BRAND_COLORS.black, align: 'right' 
    });
  });

  // Slide 2: Combos & Drinks
  const slide2 = pptx.addSlide({ masterName: 'MENU_MASTER' });
  slide2.addText('COMBOS E BEBIDAS', { x: 0.5, y: 1.2, w: '90%', h: 0.8, fontSize: 32, bold: true, color: BRAND_COLORS.black, align: 'center' });

  const combos = [
    { name: 'Combo Individual', desc: '1 Espeto + Mandioca + Farofa + Refri', price: 'R$ 22,00' },
    { name: 'Combo Casal', desc: '4 Espetos + Mandioca G + 2 Refris', price: 'R$ 45,00' },
    { name: 'Combo Família', desc: '8 Espetos + 2 Mandiocas + 4 Refris', price: 'R$ 85,00' },
  ];

  combos.forEach((combo, i) => {
    const y = 2.5 + i * 1.2;
    slide2.addText(combo.name, { x: 0.5, y: y, w: 6, h: 0.4, fontSize: 20, bold: true, color: BRAND_COLORS.orange });
    slide2.addText(combo.desc, { x: 0.5, y: y + 0.4, w: 6, h: 0.4, fontSize: 12, color: BRAND_COLORS.gray });
    slide2.addText(combo.price, { x: 8, y: y, w: 2, h: 0.4, fontSize: 22, bold: true, color: BRAND_COLORS.black, align: 'right' });
  });

  slide2.addText('Edite este arquivo no PowerPoint ou importe no Canva para personalizar!', {
    x: 0, y: 6.5, w: '100%', h: 0.5,
    fontSize: 10, color: BRAND_COLORS.gray, align: 'center', italic: true
  });

  await pptx.writeFile({ fileName: 'cardapio-editavel-espetinho.pptx' });
};
