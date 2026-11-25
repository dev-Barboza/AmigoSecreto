import { nanoid } from "nanoid";
import { color, getMeta, getPeople, handle, hashPassword, HttpError, newToken, normName, photo, rateLimit, savePerson, str, validPassword } from "@/lib/db";
import { makeKeys } from "@/lib/seal";
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
  if (!validPassword(b.password)) throw new HttpError(400, "A senha precisa ter pelo menos 4 caracteres");
  const people = await getPeople(id);
  if (people.length >= 80) throw new HttpError(400, "Grupo cheio (máx. 80)");
  if (people.some((p) => normName(p.name) === normName(name)))
    throw new HttpError(409, "Já tem alguém com esse nome no grupo. Se for você, use \"Já entrei\". Se não, coloque o sobrenome.");
  const pid = nanoid(10);
  const p: Participant = {
    id: pid,
    name,
    color: color(b.color),
    photo: photo(b.photo),
    emoji: str(b.emoji, 8),
    wishlist: [],
    joinedAt: Date.now(),
    pinHash: hashPassword(b.password),
    token: newToken(),
    ...makeKeys(pid, b.password),
  };
  await savePerson(id, p);
  return { participantId: p.id, token: p.token };
});
