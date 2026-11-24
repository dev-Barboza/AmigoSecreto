import { getMeta, getPairs, handle, HttpError, pushChat, rateLimit, requireParticipant, str } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** to = "giftee": eu (papai noel) falo com quem eu tirei. to = "santa": falo com quem me tirou. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const me = await requireParticipant(req, id);
  const meta = await getMeta(id);
  if (!meta.drawnAt) throw new HttpError(409, "O sorteio ainda não aconteceu");
  await rateLimit(id, `msg:${me.id}`, 60, 600);
  const b = await req.json().catch(() => ({}));
  const text = str(b.text, 500);
  if (!text) throw new HttpError(400, "Mensagem vazia");
  const pairs = await getPairs(id);
  if (b.to === "giftee") {
    if (!me.revealedAt) throw new HttpError(409, "Revele seu amigo secreto primeiro");
    await pushChat(id, me.id, { from: "santa", text, at: Date.now() });
  } else {
    const santaId = Object.keys(pairs).find((s) => pairs[s] === me.id);
    if (!santaId) throw new HttpError(404, "Ninguém te tirou?!");
    await pushChat(id, santaId, { from: "giftee", text, at: Date.now() });
  }
  return { ok: true };
});
