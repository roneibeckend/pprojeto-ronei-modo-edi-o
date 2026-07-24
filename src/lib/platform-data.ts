import platter1 from "@/assets/platter1.asset.json";
import platter2 from "@/assets/platter2.asset.json";
import ribeye from "@/assets/ribeye.asset.json";
import chef from "@/assets/chef-working.asset.json";
import hero from "@/assets/hero-chef.asset.json";
import skewersFlat from "@/assets/skewers-flat.asset.json";
import skewersHeld from "@/assets/skewers-held.asset.json";
import skewerSingle from "@/assets/skewer-single.asset.json";

export const IMG = {
  platter1: platter1.url,
  platter2: platter2.url,
  ribeye: ribeye.url,
  chef: chef.url,
  hero: hero.url,
  skewersFlat: skewersFlat.url,
  skewersHeld: skewersHeld.url,
  skewerSingle: skewerSingle.url,
};

export type Lesson = {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
  locked?: boolean;
};
export type Module = { id: string; title: string; lessons: Lesson[] };
export type Course = {
  id: string;
  title: string;
  description: string;
  cover: string;
  teacher: string;
  progress: number;
  totalLessons: number;
  modules: Module[];
  locked?: boolean;
  price?: number;
  badge?: string;
};

export const courses: Course[] = [
  {
    id: "curso-demo-teste",
    title: "Curso Demo — Ambiente de Testes",
    description:
      "Curso fictício liberado para validação da plataforma. Use para testar player, progresso, materiais e certificados.",
    cover: IMG.skewersHeld,
    teacher: "Equipe Espetinho na Veia",
    progress: 20,
    totalLessons: 4,
    badge: "DEMO",
    modules: [
      {
        id: "m1",
        title: "Módulo Demo — Fluxo de validação",
        lessons: [
          { id: "l1", title: "Tour da plataforma", duration: "3:20", completed: true },
          { id: "l2", title: "Testando o player de vídeo", duration: "2:45" },
          { id: "l3", title: "Testando materiais e anotações", duration: "4:10" },
          { id: "l4", title: "Encerramento e certificado de teste", duration: "1:50" },
        ],
      },
    ],
  },
  {
    id: "espetinho-lucrativo",
    title: "Espetinho Lucrativo",
    description:
      "Aprenda desde a escolha das carnes até a venda dos primeiros espetinhos.",
    cover: IMG.platter1,
    teacher: "Ronnei — Espetos Grill",
    progress: 42,
    totalLessons: 20,
    modules: [
      {
        id: "m1",
        title: "Módulo 1 — Começando do jeito certo",
        lessons: [
          { id: "l1", title: "Boas-vindas", duration: "4:12", completed: true },
          { id: "l2", title: "Como funciona o mercado de espetinhos", duration: "9:30", completed: true },
          { id: "l3", title: "Equipamentos necessários", duration: "12:05", completed: true },
          { id: "l4", title: "Quanto investir para começar", duration: "8:44" },
        ],
      },
      {
        id: "m2",
        title: "Módulo 2 — Escolha e preparação das carnes",
        lessons: [
          { id: "l5", title: "Melhores carnes para espetinho", duration: "11:20", completed: true },
          { id: "l6", title: "Como cortar corretamente", duration: "14:02", completed: true },
          { id: "l7", title: "Como temperar", duration: "10:15" },
          { id: "l8", title: "Como armazenar com segurança", duration: "7:48" },
        ],
      },
      {
        id: "m3",
        title: "Módulo 3 — Montagem e produção",
        lessons: [
          { id: "l9", title: "Padronização dos espetinhos", duration: "9:12" },
          { id: "l10", title: "Quantidade ideal de carne", duration: "6:50" },
          { id: "l11", title: "Organização da produção", duration: "11:33", locked: true },
          { id: "l12", title: "Como evitar desperdícios", duration: "8:22", locked: true },
        ],
      },
      {
        id: "m4",
        title: "Módulo 4 — Preço e lucro",
        lessons: [
          { id: "l13", title: "Como calcular o custo", duration: "13:10", locked: true },
          { id: "l14", title: "Como definir o preço", duration: "10:44", locked: true },
          { id: "l15", title: "Margem de lucro", duration: "9:05", locked: true },
          { id: "l16", title: "Combos e promoções", duration: "8:18", locked: true },
        ],
      },
      {
        id: "m5",
        title: "Módulo 5 — Divulgação e vendas",
        lessons: [
          { id: "l17", title: "Como divulgar no Instagram", duration: "12:40", locked: true },
          { id: "l18", title: "Como vender pelo WhatsApp", duration: "10:12", locked: true },
          { id: "l19", title: "Fotos que despertam vontade", duration: "9:33", locked: true },
          { id: "l20", title: "Atendimento e fidelização", duration: "11:05", locked: true },
        ],
      },
    ],
  },
  {
    id: "molhos-acompanhamentos",
    title: "Molhos e Acompanhamentos",
    description:
      "Receitas para aumentar o valor do pedido e melhorar a experiência do cliente.",
    cover: IMG.platter2,
    teacher: "Ronnei — Espetos Grill",
    progress: 18,
    totalLessons: 12,
    modules: [
      { id: "m1", title: "Molhos clássicos", lessons: [
        { id: "l1", title: "Vinagrete artesanal", duration: "6:20", completed: true },
        { id: "l2", title: "Molho da casa", duration: "7:40" },
        { id: "l3", title: "Chimichurri", duration: "5:55" },
      ]},
      { id: "m2", title: "Acompanhamentos", lessons: [
        { id: "l4", title: "Farofa crocante", duration: "8:10" },
        { id: "l5", title: "Pão de alho", duration: "6:00" },
        { id: "l6", title: "Arroz especial", duration: "9:22", locked: true },
      ]},
    ],
  },
  {
    id: "vender-mais",
    title: "Como Vender Mais",
    description: "Estratégias de preço, divulgação, atendimento e fidelização de clientes.",
    cover: IMG.chef,
    teacher: "Ronnei — Espetos Grill",
    progress: 0,
    totalLessons: 10,
    modules: [
      { id: "m1", title: "Precificação inteligente", lessons: [
        { id: "l1", title: "Preço percebido x preço real", duration: "10:15" },
        { id: "l2", title: "Combos que vendem", duration: "8:40" },
      ]},
      { id: "m2", title: "Divulgação prática", lessons: [
        { id: "l3", title: "Instagram do zero", duration: "12:00", locked: true },
        { id: "l4", title: "WhatsApp como caixa", duration: "9:30", locked: true },
      ]},
    ],
  },
  {
    id: "gestao-negocio",
    title: "Gestão do Negócio",
    description: "Organização de estoque, custos, lucros e planejamento de compras.",
    cover: IMG.ribeye,
    teacher: "Ronnei — Espetos Grill",
    progress: 5,
    totalLessons: 14,
    modules: [
      { id: "m1", title: "Controle financeiro", lessons: [
        { id: "l1", title: "Separar PF e PJ", duration: "9:00", completed: true },
        { id: "l2", title: "Planilha de custos", duration: "11:20" },
      ]},
    ],
  },
];

export type Ebook = {
  id: string;
  title: string;
  description: string;
  cover: string;
  pages: number;
  category: string;
  progress: number;
};

export const ebooks: Ebook[] = [
  { id: "guia-completo", title: "Guia Completo do Espetinho Lucrativo", description: "O passo a passo do zero aos 10k por mês.", cover: IMG.hero, pages: 84, category: "Negócio", progress: 60 },
  { id: "50-receitas", title: "50 Receitas de Espetinhos", description: "Variedade que fideliza clientes.", cover: IMG.platter1, pages: 62, category: "Receitas", progress: 30 },
  { id: "molhos-vendem", title: "Molhos que Vendem", description: "Aumente o ticket médio com molhos irresistíveis.", cover: IMG.platter2, pages: 40, category: "Receitas", progress: 0 },
  { id: "manual-temperos", title: "Manual de Temperos", description: "Combinações profissionais e proporções ideais.", cover: IMG.ribeye, pages: 36, category: "Técnica", progress: 12 },
  { id: "custos-lucros", title: "Como Calcular Custos e Lucros", description: "Fórmulas e planilhas prontas.", cover: IMG.chef, pages: 28, category: "Gestão", progress: 100 },
  { id: "divulgacao", title: "Guia de Divulgação para Espetinhos", description: "Do Instagram ao boca a boca.", cover: IMG.skewersFlat, pages: 44, category: "Marketing", progress: 0 },
  { id: "checklist-abrir", title: "Checklist para Abrir seu Negócio", description: "Não esqueça de nada antes da primeira venda.", cover: IMG.skewersHeld, pages: 18, category: "Negócio", progress: 0 },
];

export type Recipe = {
  id: string;
  name: string;
  category: string;
  image: string;
  ingredients: string[];
  yield: string;
  time: string;
  difficulty: "Fácil" | "Médio" | "Avançado";
  steps: string[];
  cost: string;
  sellPrice: string;
  profit: string;
};

export const recipeCategories = ["Todos", "Carne bovina", "Frango", "Linguiça", "Suíno", "Queijo", "Vegetarianos", "Molhos", "Acompanhamentos"];

export const recipes: Recipe[] = [
  { id: "r1", name: "Espetinho de Alcatra Premium", category: "Carne bovina", image: IMG.ribeye, ingredients: ["500g de alcatra", "Sal grosso", "Alho", "Azeite"], yield: "6 espetos", time: "35 min", difficulty: "Fácil", steps: ["Corte em cubos de 3cm", "Tempere e descanse 30 min", "Monte com espaçamento", "Asse na brasa forte"], cost: "R$ 3,20/un", sellPrice: "R$ 10,00", profit: "212% margem" },
  { id: "r2", name: "Espetinho de Frango com Bacon", category: "Frango", image: IMG.platter1, ingredients: ["Peito de frango", "Bacon em tiras", "Páprica"], yield: "8 espetos", time: "40 min", difficulty: "Fácil", steps: ["Corte o frango em cubos", "Enrole o bacon", "Tempere", "Asse na brasa média"], cost: "R$ 2,40/un", sellPrice: "R$ 9,00", profit: "275% margem" },
  { id: "r3", name: "Espetinho de Linguiça Toscana", category: "Linguiça", image: IMG.platter2, ingredients: ["Linguiça toscana", "Pimentão", "Cebola"], yield: "6 espetos", time: "25 min", difficulty: "Fácil", steps: ["Corte em rodelas", "Alterne com legumes", "Asse até dourar"], cost: "R$ 2,80/un", sellPrice: "R$ 8,00", profit: "185% margem" },
  { id: "r4", name: "Espetinho de Queijo Coalho", category: "Queijo", image: IMG.chef, ingredients: ["Queijo coalho", "Orégano"], yield: "10 espetos", time: "15 min", difficulty: "Fácil", steps: ["Corte em cubos", "Espete", "Grelhe rapidamente"], cost: "R$ 2,10/un", sellPrice: "R$ 8,00", profit: "280% margem" },
  { id: "r5", name: "Espeto de Legumes", category: "Vegetarianos", image: IMG.skewersFlat, ingredients: ["Abobrinha", "Pimentão", "Cebola", "Tomate cereja"], yield: "6 espetos", time: "20 min", difficulty: "Fácil", steps: ["Corte", "Tempere com azeite e ervas", "Grelhe"], cost: "R$ 1,80/un", sellPrice: "R$ 7,00", profit: "290% margem" },
  { id: "r6", name: "Molho Chimichurri", category: "Molhos", image: IMG.platter2, ingredients: ["Salsinha", "Alho", "Vinagre", "Azeite"], yield: "300ml", time: "10 min", difficulty: "Fácil", steps: ["Pique tudo bem fino", "Misture", "Descanse 2h"], cost: "R$ 4,00/lote", sellPrice: "R$ 5,00/porção", profit: "400% margem" },
];

export const materials = [
  { id: "m1", title: "Planilha de custos", description: "Controle detalhado de matéria-prima e insumos.", type: "XLSX" },
  { id: "m2", title: "Calculadora de preço de venda", description: "Descubra o preço ideal em segundos.", type: "XLSX" },
  { id: "m3", title: "Controle de estoque", description: "Nunca fique sem o essencial.", type: "XLSX" },
  { id: "m4", title: "Lista de compras semanal", description: "Modelo pronto para imprimir.", type: "PDF" },
  { id: "m5", title: "Checklist de equipamentos", description: "Tudo que você precisa para começar.", type: "PDF" },
  { id: "m6", title: "Cardápio editável", description: "Modelo profissional em Canva.", type: "CANVA" },
  { id: "m7", title: "Artes para divulgação", description: "10 posts prontos para Instagram.", type: "ZIP" },
  { id: "m8", title: "Modelo de controle de vendas", description: "Acompanhe seu faturamento diário.", type: "XLSX" },
];

export const certificates = [
  { id: "c1", course: "Espetinho Lucrativo", hours: 12, completedAt: "—", unlocked: false },
  { id: "c2", course: "Molhos e Acompanhamentos", hours: 6, completedAt: "12/06/2026", unlocked: true, code: "EVNA-2026-M1A9" },
  { id: "c3", course: "Como Vender Mais", hours: 8, completedAt: "—", unlocked: false },
  { id: "c4", course: "Gestão do Negócio", hours: 10, completedAt: "—", unlocked: false },
];

export const achievements = [
  { id: "a1", title: "Primeira aula concluída", unlocked: true },
  { id: "a2", title: "Primeiro curso finalizado", unlocked: true },
  { id: "a3", title: "Mestre dos espetinhos", unlocked: false },
  { id: "a4", title: "Especialista em vendas", unlocked: false },
  { id: "a5", title: "Negócio em ação", unlocked: false },
];

export const supportQuestions = [
  { q: "Qual carne é melhor para começar?", a: "Alcatra e coxão mole têm ótimo custo-benefício e agradam a maioria dos clientes. Comece com uma dessas para reduzir desperdício." },
  { q: "Como calcular o preço do espetinho?", a: "Some custo da carne + tempero + palito + embalagem. Multiplique por 3 para obter uma margem saudável de ~200%." },
  { q: "Quanto preciso investir?", a: "Com R$ 800 a R$ 1.500 você monta uma operação inicial com churrasqueira, carnes, temperos, embalagens e divulgação básica." },
  { q: "Como conservar as carnes?", a: "Mantenha entre 0°C e 4°C, sempre em recipientes fechados. Temperos com sal só nas últimas 2 horas antes de assar." },
  { q: "Como divulgar meu negócio?", a: "Comece pelo WhatsApp com seus contatos + posts diários no Instagram mostrando o preparo. Boca a boca é seu maior aliado." },
  { q: "Onde encontro meus e-books?", a: "Na aba \"Biblioteca de e-books\" no menu lateral. Você pode ler online ou baixar em PDF." },
  { q: "Como emitir meu certificado?", a: "Conclua 100% de um curso e o certificado é liberado automaticamente na aba \"Certificados\"." },
];

export const student = {
  name: "André Silva",
  email: "andre@exemplo.com",
  phone: "(11) 98765-4321",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Andre%20Silva&backgroundColor=e11d48",
  since: "03/03/2026",
  totalProgress: 34,
  lessonsWatched: 47,
  materials: 8,
  streak: 7,
  lastLesson: {
    courseId: "espetinho-lucrativo",
    lessonTitle: "Como temperar",
    percent: 64,
  },
};

export const adminStats = {
  students: 2847,
  activeCourses: 4,
  ebooks: 7,
  lessonsWatched: 18420,
  avgCompletion: 62,
  activeRecent: 412,
  revenue: "R$ 137.240,00",
  chart: [12, 18, 22, 19, 28, 34, 41, 38, 46, 52, 58, 64],
};
