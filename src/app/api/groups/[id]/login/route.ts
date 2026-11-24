import { checkPassword, getPeople, handle, HttpError, normName, rateLimit, str } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** Entrar de novo num grupo específico: nome + senha. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const name = normName(str(b.name, 40));
  const password = String(b.password ?? "");
  if (!name || !password) throw new HttpError(400, "Digite seu nome e sua senha");
  await rateLimit(id, `login:${name}`, 8, 900);
  const people = await getPeople(id);
  const p = people.find((x) => normName(x.name) === name);
  if (!p || !checkPassword(id, password, p.pinHash)) throw new HttpError(401, "Nome ou senha incorretos");
  return { participantId: p.id, token: p.token };
});
