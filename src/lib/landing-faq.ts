export type LandingFaq = { q: string; a: string };

/**
 * Perguntas da seção de FAQ da landing.
 * Ficam em módulo próprio para que a lista possa ser renderizada no SSR
 * (bom para SEO) enquanto o widget interativo do chat é carregado sob demanda.
 */
export const landingFaqs: LandingFaq[] = [
  { q: "Preciso de muito dinheiro para começar?", a: "Não. O método mostra caminhos para começar pequeno, com investimento baixo e crescer de forma sustentável." },
  { q: "E se eu não gostar do material?", a: "Você tem 7 dias de garantia total. Se não gostar, basta pedir o reembolso e devolvemos 100% do valor. Sem perguntas." },
  { q: "Em quanto tempo recupero o investimento?", a: "Seguindo o plano de ação, muitos alunos recuperam o valor do eBook nas primeiras vendas — geralmente já na primeira semana." },
  { q: "Preciso ter experiência com churrasco?", a: "Não. O método foi pensado para iniciantes absolutos. Você é guiado passo a passo desde a escolha da carne até a venda." },
  { q: "E se eu morar em cidade pequena?", a: "As estratégias funcionam em qualquer região — cidade grande, interior, bairro residencial ou comercial." },
  { q: "Funciona também para delivery?", a: "Sim. Tem estratégias específicas para venda por WhatsApp, iFood e delivery próprio, além do ponto físico." },
  { q: "Como recebo o material?", a: "O acesso é liberado automaticamente por e-mail em minutos, após a confirmação do pagamento. Você lê no celular, tablet ou computador." },
];
