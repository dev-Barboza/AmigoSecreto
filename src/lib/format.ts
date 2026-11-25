const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
export const money = (n?: number) => (n === undefined || n === null ? "" : brl.format(n));

export function budgetLabel(min?: number, max?: number) {
  if (min && max) return `${money(min)} a ${money(max)}`;
  if (max) return `até ${money(max)}`;
  if (min) return `a partir de ${money(min)}`;
  return "Sem limite de preço";
}

export function inBudget(price: number | undefined, min?: number, max?: number) {
  if (price === undefined) return null;
  if (max !== undefined && price > max) return "above" as const;
  if (min !== undefined && price < min) return "below" as const;
  return "ok" as const;
}

export const dateLabel = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : "";

const SITES: [RegExp, string][] = [
  [/amazon\.|amzn\./, "Amazon"],
  [/mercadoli[vb]re\.|mercadolivre|meli\.la/, "Mercado Livre"],
  [/magazineluiza\.|magalu\./, "Magalu"],
  [/shopee\./, "Shopee"],
  [/americanas\./, "Americanas"],
  [/casasbahia\./, "Casas Bahia"],
  [/shein\./, "Shein"],
  [/aliexpress\./, "AliExpress"],
  [/netshoes\./, "Netshoes"],
  [/kabum\./, "KaBuM!"],
];
/** "https://www.amazon.com.br/hz/wishlist/..." vira "Amazon". */
export function siteName(link: string) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    return SITES.find(([re]) => re.test(host))?.[1] ?? host;
  } catch {
    return "outro site";
  }
}

export const BODY_COLORS = ["#d94a3d", "#16a34a", "#2563eb", "#f59e0b", "#9333ea", "#0891b2", "#db2777", "#ea580c", "#475569", "#65a30d"];
