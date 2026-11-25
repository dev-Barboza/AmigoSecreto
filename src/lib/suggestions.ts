export type Suggestion = { title: string; price: number; tag: string };

export const SUGGESTIONS: Suggestion[] = [
  { title: "Caneca personalizada", price: 35, tag: "Casa" },
  { title: "Kit chocolates artesanais", price: 45, tag: "Comida" },
  { title: "Meias divertidas (kit 3)", price: 40, tag: "Moda" },
  { title: "Livro de bolso", price: 50, tag: "Leitura" },
  { title: "Vela aromática", price: 55, tag: "Casa" },
  { title: "Planta suculenta com vaso", price: 40, tag: "Casa" },
  { title: "Garrafa térmica", price: 80, tag: "Esporte" },
  { title: "Fone de ouvido bluetooth", price: 120, tag: "Tech" },
  { title: "Jogo de cartas / tabuleiro", price: 90, tag: "Diversão" },
  { title: "Kit skincare", price: 100, tag: "Beleza" },
  { title: "Perfume", price: 180, tag: "Beleza" },
  { title: "Carregador portátil (power bank)", price: 110, tag: "Tech" },
  { title: "Kit churrasco", price: 130, tag: "Comida" },
  { title: "Vinho especial", price: 90, tag: "Bebida" },
  { title: "Luminária LED", price: 70, tag: "Casa" },
  { title: "Quebra-cabeça 1000 peças", price: 75, tag: "Diversão" },
  { title: "Bolsa / necessaire", price: 85, tag: "Moda" },
  { title: "Boné ou gorro", price: 60, tag: "Moda" },
  { title: "Caixa de som bluetooth", price: 200, tag: "Tech" },
  { title: "Vale-presente (gift card)", price: 100, tag: "Coringa" },
  { title: "Kit café especial", price: 65, tag: "Comida" },
  { title: "Cobertor / manta", price: 120, tag: "Casa" },
  { title: "Relógio inteligente básico", price: 250, tag: "Tech" },
  { title: "Chinelo / pantufa", price: 50, tag: "Moda" },
  { title: "Kit de pincéis e tintas", price: 70, tag: "Arte" },
  { title: "Assinatura de streaming (3 meses)", price: 90, tag: "Diversão" },
];

export function suggestionsFor(min?: number, max?: number) {
  return SUGGESTIONS.filter((s) => (max === undefined || s.price <= max) && (min === undefined || s.price >= min * 0.7));
}
