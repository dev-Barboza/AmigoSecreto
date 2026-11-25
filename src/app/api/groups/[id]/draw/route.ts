import { clearDraw, getPeople, handle, HttpError, requireAdmin, saveMeta, savePairs, savePerson, sealPairs } from "@/lib/db";
import { drawPairs } from "@/lib/draw";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const meta = await requireAdmin(req, id);
  if (meta.drawnAt) throw new HttpError(409, "O sorteio já foi feito");
  const people = await getPeople(id);
  if (people.length < 3) throw new HttpError(400, "Precisa de pelo menos 3 pessoas");
  const noKeys = people.filter((p) => !p.pubKey);
  if (noKeys.length)
    throw new HttpError(409, `Antes de sortear, ${noKeys.map((p) => p.name).join(", ")} precisa(m) sair e entrar de novo com nome e senha.`);
  const pairs = drawPairs(people.map((p) => p.id), meta.exclusions);
  if (!pairs) throw new HttpError(400, "Com essas restrições não dá para sortear. Remova algumas e tente de novo.");
  await savePairs(id, sealPairs(people, pairs)); // só a versão trancada vai para o banco
  meta.drawnAt = Date.now();
  await saveMeta(meta);
  return { ok: true, drawnAt: meta.drawnAt };
});

/** Desfaz o sorteio (apaga pares, revelações e mensagens). */
export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const meta = await requireAdmin(req, id);
  const people = await getPeople(id);
  await clearDraw(id, people.map((p) => p.id));
  for (const p of people) {
    if (p.revealedAt) {
      delete p.revealedAt;
      await savePerson(id, p);
    }
  }
  delete meta.drawnAt;
  await saveMeta(meta);
  return { ok: true };
});
