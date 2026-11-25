import { getPerson, handle, hashPassword, HttpError, requireAdmin, savePerson, str, validPassword } from "@/lib/db";
import { makeKeys } from "@/lib/seal";

type Ctx = { params: Promise<{ id: string }> };

/** Quem organiza define uma senha nova para alguém que esqueceu. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const meta = await requireAdmin(req, id);
  const b = await req.json().catch(() => ({}));
  const p = await getPerson(id, str(b.participantId, 30));
  if (!p) throw new HttpError(404, "Participante não encontrado");
  if (!validPassword(b.password)) throw new HttpError(400, "A senha precisa ter pelo menos 4 caracteres");
  // depois do sorteio, a senha nova não abre o resultado antigo (ele foi trancado com a senha velha)
  if (meta.drawnAt && !b.force)
    throw new HttpError(409, "O sorteio já foi feito. Com senha nova, essa pessoa não consegue mais abrir o resultado e vai ser preciso refazer o sorteio.");
  p.pinHash = hashPassword(b.password);
  Object.assign(p, makeKeys(p.id, b.password));
  await savePerson(id, p);
  return { ok: true };
});
