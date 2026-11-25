import { checkPassword, ensureKeys, findByName, getMeta, getPerson, handle, HttpError, normName, openMatch, rateLimit, str } from "@/lib/db";

/**
 * Entrar pela página inicial só com nome + senha: procura em todos os grupos
 * onde existe alguém com esse nome e devolve os que batem com a senha.
 */
export const POST = handle(async (req: Request) => {
  const b = await req.json().catch(() => ({}));
  const raw = str(b.name, 40);
  const password = String(b.password ?? "");
  if (!raw || !password) throw new HttpError(400, "Digite seu nome e sua senha");
  await rateLimit("_global", `login:${normName(raw)}`, 10, 900);

  const matches = [];
  for (const { gid, pid } of await findByName(raw)) {
    const p = await getPerson(gid, pid);
    if (!p || !checkPassword(gid, password, p.pinHash)) continue;
    const meta = await getMeta(gid).catch(() => null);
    if (!meta) continue;
    await ensureKeys(gid, p, password);
    const matchId = meta.drawnAt && p.revealedAt ? await openMatch(gid, p, password) : null;
    matches.push({
      gid, groupName: meta.name, participantId: p.id, token: p.token,
      match: matchId ? { id: matchId, drawnAt: meta.drawnAt } : undefined,
    });
  }
  if (!matches.length) throw new HttpError(401, "Nome ou senha incorretos");
  return { matches };
});
