import type { Theme } from "./theme";

export type WishItem = {
  id: string;
  title: string;
  price?: number;
  link?: string;
  note?: string;
  priority: 1 | 2 | 3; // 3 = quero muito
};

export type Participant = {
  id: string;
  name: string;
  color: string;
  photo?: string; // data URL (jpeg pequeno)
  emoji: string;
  wishlist: WishItem[];
  likes?: string;
  dislikes?: string;
  sizes?: string;
  joinedAt: number;
  revealedAt?: number;
  pinHash: string;
  token: string;
};

export type PublicParticipant = Omit<Participant, "pinHash" | "token">;

export type GroupMeta = {
  id: string;
  name: string;
  description?: string;
  eventDate?: string; // ISO
  eventPlace?: string;
  budgetMin?: number;
  budgetMax?: number;
  organizerName: string;
  adminKey: string;
  createdAt: number;
  drawnAt?: number;
  exclusions: [string, string][];
  /** cenário do lobby; grupos antigos não têm (= natal) */
  theme?: Theme;
};

export type PublicGroup = Omit<GroupMeta, "adminKey">;

export type ChatMessage = {
  from: "santa" | "giftee";
  text: string;
  at: number;
};

export type MeResponse = {
  me: PublicParticipant;
  group: PublicGroup;
  match?: PublicParticipant;
  chatWithGiftee: ChatMessage[];
  chatWithSanta: ChatMessage[];
};
