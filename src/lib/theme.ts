export type Theme = "natal" | "tribunal";

export const THEMES: { id: Theme; label: string; desc: string; swatch: string[] }[] = [
  { id: "natal", label: "Natal", desc: "Neve, árvore e bonecos de Papai Noel.", swatch: ["#166534", "#eef4ff", "#dc2626"] },
  { id: "tribunal", label: "Tribunal", desc: "Plenário de mármore, balança da justiça e bonecos de toga.", swatch: ["#151515", "#ece6da", "#d4a537"] },
];

export const parseTheme = (v: unknown): Theme => (v === "tribunal" ? "tribunal" : "natal");
