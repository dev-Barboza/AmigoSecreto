import { nanoid } from "nanoid";
import { color, getMeta, getPeople, handle, hashPin, HttpError, newToken, photo, rateLimit, savePerson, str, validPin } from "@/lib/db";
import type { Participant } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const meta = await getMeta(id);
  if (meta.drawnAt) throw new HttpError(409, "O sorteio já aconteceu. Peça para quem organiza refazer se você quiser entrar.");
  await rateLimit(id, "join", 120, 3600);
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 40);
  if (!name) throw new HttpError(400, "Qual o seu nome?");
  if (!validPin(b.pin)) throw new HttpError(400, "O PIN precisa ter de 4 a 6 números");
  const people = await getPeople(id);
  if (people.length >= 80) throw new HttpError(400, "Grupo cheio (máx. 80)");
  if (people.some((p) => p.name.toLowerCase() === name.toLowerCase()))
    throw new HttpError(409, "Já tem alguém com esse nome. Se for você, use \"Já entrei\".");
  const p: Participant = {
    id: nanoid(10),
    name,
    color: color(b.color),
    photo: photo(b.photo),
    emoji: str(b.emoji, 8),
    wishlist: [],
    joinedAt: Date.now(),
    pinHash: hashPin(id, b.pin),
    token: newToken(),
  };
  await savePerson(id, p);
  return { participantId: p.id, token: p.token };
});
