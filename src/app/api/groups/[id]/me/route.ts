import {
  cleanWishlist, color, getMeta, groupPublic, handle,
  photo, requireParticipant, savePerson, str, toPublic,
} from "@/lib/db";
import type { MeResponse } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: Request, { params }: Ctx): Promise<MeResponse> => {
  const { id } = await params;
  const me = await requireParticipant(req, id);
  const meta = await getMeta(id);
  // o par não sai daqui: só /reveal (com a senha) consegue abrir
  return { me: toPublic(me), group: groupPublic(meta) };
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
  await savePerson(id, me);
  return { me: toPublic(me) };
});
