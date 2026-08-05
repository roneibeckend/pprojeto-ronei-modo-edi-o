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

export const recipeCategories = ["Todos", "Carne bovina", "Frango", "Linguiça", "Suíno", "Queijo", "Vegetarianos", "Molhos", "Acompanhamentos"];

export const supportQuestions = [
  { q: "Como calcular o preço do espetinho?", a: "Some custo da carne + tempero + palito + embalagem. Multiplique por 3 para obter uma margem saudável de ~200%." },
  { q: "Quanto preciso investir?", a: "Com R$ 800 a R$ 1.500 você monta uma operação inicial com churrasqueira, carnes, temperos, embalagens e divulgação básica." },
  { q: "Como conservar as carnes?", a: "Mantenha entre 0°C e 4°C, sempre em recipientes fechados. Temperos com sal só nas últimas 2 horas antes de assar." },
  { q: "Como divulgar meu negócio?", a: "Comece pelo WhatsApp com seus contatos + posts diários no Instagram mostrando o preparo. Boca a boca é seu maior aliado." },
  { q: "Onde encontro meus e-books?", a: "Na aba \"Biblioteca de e-books\" no menu lateral. Você pode ler online ou baixar em PDF." },
  { q: "Como emitir meu certificado?", a: "Conclua 100% de um curso e o certificado é liberado automaticamente na aba \"Certificados\"." },
];
