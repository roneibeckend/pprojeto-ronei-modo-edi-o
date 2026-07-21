export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  featured?: boolean;
};

export const FAQ: FaqItem[] = [
  {
    id: "app-cliente",
    category: "Clientes",
    question: "Meu cliente precisa baixar um aplicativo?",
    answer:
      "Não. A Fidelize funciona 100% pelo navegador. O cliente escaneia o QR Code e acessa a campanha direto pelo celular, sem instalar nada.",
  },
  {
    id: "carimbo-sozinho",
    category: "Segurança",
    question: "Como impedir que o cliente carimbe sozinho?",
    answer:
      "Cada carimbo é validado por um QR Code dinâmico que só o estabelecimento tem acesso, ou por um PIN do atendente. O cliente não consegue se autocarimbar.",
  },
  {
    id: "cancelar",
    category: "Plano",
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim. Não temos fidelidade — você cancela pelo painel a qualquer momento e mantém acesso até o fim do ciclo já pago.",
    featured: true,
  },
  {
    id: "mais-campanhas",
    category: "Campanhas",
    question: "Posso ter mais de uma campanha?",
    answer:
      "Depende do plano. O plano Essencial permite 1 campanha ativa; Pro e Premium permitem várias campanhas simultâneas.",
  },
  {
    id: "offline",
    category: "Uso",
    question: "Funciona sem internet?",
    answer:
      "É necessária conexão para carimbar e resgatar prêmios. Sem internet, os registros ficam pendentes e sincronizam quando a conexão volta.",
  },
  {
    id: "qr-code",
    category: "QR Code",
    question: "Como funciona o QR Code?",
    answer:
      "Você imprime ou exibe o QR Code da campanha. O cliente escaneia, se identifica com telefone/e-mail e recebe o carimbo automaticamente.",
    featured: true,
  },
  {
    id: "cadastro-clientes",
    category: "Clientes",
    question: "Como cadastrar meus clientes?",
    answer:
      "Os clientes se cadastram sozinhos ao escanear o QR Code pela primeira vez. Você também pode importar uma planilha em Clientes → Importar.",
  },
  {
    id: "criar-campanha",
    category: "Campanhas",
    question: "Como criar uma campanha?",
    answer:
      "Vá em Campanhas → Nova campanha. Escolha o tipo (cartão fidelidade, cashback, pontos), defina a recompensa e clique em Publicar.",
  },
  {
    id: "fidelidade",
    category: "Campanhas",
    question: "Como funciona o programa de fidelidade?",
    answer:
      "Você define quantos carimbos o cliente precisa acumular para ganhar uma recompensa. A cada compra elegível, um carimbo é adicionado automaticamente.",
  },
  {
    id: "relatorios",
    category: "Relatórios",
    question: "Como vejo meus relatórios?",
    answer:
      "Em Painel → Relatórios você acompanha clientes ativos, carimbos, recompensas resgatadas e faturamento por período.",
  },
  {
    id: "multi-estabelecimento",
    category: "Plano",
    question: "Posso usar em mais de um estabelecimento?",
    answer:
      "Sim, a partir do plano Pro. Você cadastra cada unidade e visualiza relatórios individuais e consolidados.",
  },
  {
    id: "avaliacao",
    category: "Recursos",
    question: "Como funciona a avaliação de atendimento?",
    answer:
      "Após o carimbo, o cliente pode dar uma nota de 1 a 5. Avaliações negativas ficam privadas para você agir; positivas podem ser redirecionadas para o Google.",
  },
  {
    id: "arvore-links",
    category: "Recursos",
    question: "Como funciona a Árvore de Links?",
    answer:
      "É uma página pública com todos os seus links (WhatsApp, redes, cardápio, campanha) organizados. Personalize em Ferramentas → Árvore de Links.",
  },
  {
    id: "imprimir-qr",
    category: "QR Code",
    question: "Como imprimir meu QR Code?",
    answer:
      "Em Campanhas → sua campanha → Materiais, baixe o PDF pronto para impressão em vários tamanhos (A4, cartão, display de mesa).",
  },
  {
    id: "display-qr",
    category: "QR Code",
    question: "Como configurar o Display QR Code?",
    answer:
      "Acesse Ferramentas → Display, escolha o modelo, cores da sua marca e baixe o PDF. Também é possível exibir direto na tela de um tablet.",
  },
  {
    id: "compartilhar",
    category: "Campanhas",
    question: "Como compartilhar minha campanha?",
    answer:
      "Cada campanha tem um link público. Use o botão Compartilhar para enviar por WhatsApp, redes sociais ou copiar o link.",
  },
  {
    id: "funcionarios",
    category: "Equipe",
    question: "Como adicionar funcionários?",
    answer:
      "Em Configurações → Equipe, clique em Adicionar. Envie um convite por e-mail e defina o nível de acesso (atendente, gerente, admin).",
  },
  {
    id: "senha",
    category: "Conta",
    question: "Como alterar minha senha?",
    answer:
      "Vá em Perfil → Segurança → Alterar senha. Se esqueceu a atual, use Esqueci minha senha na tela de login.",
  },
  {
    id: "trocar-plano",
    category: "Plano",
    question: "Como trocar meu plano?",
    answer:
      "Em Configurações → Plano e cobrança, escolha o novo plano. Upgrades são imediatos; downgrades entram no próximo ciclo.",
  },
  {
    id: "suporte-humano",
    category: "Suporte",
    question: "Como falar com o suporte humano?",
    answer:
      "Se a Bruna não conseguir resolver, clique em Falar com atendente ou envie um e-mail para suporte@fidelize.com. Respondemos em até 2h úteis.",
    featured: true,
  },
];

export const FAQ_CATEGORIES = Array.from(new Set(FAQ.map((f) => f.category)));

export function faqAsContext(): string {
  return FAQ.map(
    (f, i) => `${i + 1}. [${f.category}] P: ${f.question}\n   R: ${f.answer}`,
  ).join("\n\n");
}
