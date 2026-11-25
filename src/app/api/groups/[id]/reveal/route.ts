import { checkPassword, ensureKeys, getMeta, handle, HttpError, openMatch, rateLimit, requireParticipant, savePerson } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** Abre "quem eu tirei" com a senha da pessoa. O servidor só consegue ler o resultado nesta hora. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const me = await requireParticipant(req, id);
  const meta = await getMeta(id);
  if (!meta.drawnAt) throw new HttpError(409, "O sorteio ainda não aconteceu");
  await rateLimit(id, `reveal:${me.id}`, 10, 900);
  const b = await req.json().catch(() => ({}));
  const password = String(b.password ?? "");
  if (!checkPassword(id, password, me.pinHash)) throw new HttpError(401, "Senha incorreta");
  await ensureKeys(id, me, password);
  const matchId = await openMatch(id, me, password);
  if (!matchId)
    throw new HttpError(409, "Não deu para abrir seu resultado: a senha foi trocada depois do sorteio. Peça para quem organiza refazer o sorteio.");
  if (!me.revealedAt) {
    me.revealedAt = Date.now();
    await savePerson(id, me);
  }
  return { match: { id: matchId, drawnAt: meta.drawnAt } };
});
