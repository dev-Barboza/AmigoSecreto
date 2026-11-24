import {
  cleanWishlist, color, getChat, getMeta, getPairs, getPerson, groupPublic, handle, HttpError,
  photo, requireParticipant, savePerson, str, toPublic,
} from "@/lib/db";
import type { MeResponse } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: Request, { params }: Ctx): Promise<MeResponse> => {
  const { id } = await params;
  const me = await requireParticipant(req, id);
  const meta = await getMeta(id);
  const res: MeResponse = { me: toPublic(me), group: groupPublic(meta), chatWithGiftee: [], chatWithSanta: [] };
  if (meta.drawnAt) {
    const pairs = await getPairs(id);
    const gifteeId = pairs[me.id];
    const santaId = Object.keys(pairs).find((s) => pairs[s] === me.id);
    if (gifteeId && me.revealedAt) {
      const giftee = await getPerson(id, gifteeId);
      if (giftee) res.match = toPublic(giftee);
      res.chatWithGiftee = await getChat(id, me.id);
    }
    if (santaId) res.chatWithSanta = await getChat(id, santaId);
  }
  return res;
});

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const me = await requireParticipant(req, id);
  const b = await req.json().catch(() => ({}));
  if ("wishlist" in b) me.wishlist = cleanWishlist(b.wishlist);
  if ("color" in b) me.color = color(b.color, me.color);
  if ("photo" in b) me.photo = photo(b.photo);
  if ("emoji" in b) me.emoji = str(b.emoji, 8) || me.emoji;
  if ("likes" in b) me.likes = str(b.likes, 400) || undefined;
  if ("dislikes" in b) me.dislikes = str(b.dislikes, 400) || undefined;
  if ("sizes" in b) me.sizes = str(b.sizes, 200) || undefined;
  if (b.reveal) {
    const meta = await getMeta(id);
    if (!meta.drawnAt) throw new HttpError(409, "O sorteio ainda não aconteceu");
    me.revealedAt ??= Date.now();
  }
  await savePerson(id, me);
  return { me: toPublic(me) };
});
