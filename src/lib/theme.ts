export type Theme = "natal" | "tribunal";

export const THEMES: { id: Theme; label: string; desc: string; icon: string }[] = [
  { id: "natal", label: "Natal", desc: "Neve, árvore e bonecos de Papai Noel.", icon: "🎄" },
  { id: "tribunal", label: "Tribunal", desc: "Plenário de mármore, balança da justiça e bonecos de toga.", icon: "⚖️" },
];

export const parseTheme = (v: unknown): Theme => (v === "tribunal" ? "tribunal" : "natal");
