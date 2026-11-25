import { getPerson, handle, hashPassword, HttpError, requireAdmin, savePerson, str, validPassword } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** Quem organiza define uma senha nova para alguém que esqueceu. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAdmin(req, id);
  const b = await req.json().catch(() => ({}));
  const p = await getPerson(id, str(b.participantId, 30));
  if (!p) throw new HttpError(404, "Participante não encontrado");
  if (!validPassword(b.password)) throw new HttpError(400, "A senha precisa ter pelo menos 4 caracteres");
  p.pinHash = hashPassword(b.password);
  await savePerson(id, p);
  return { ok: true };
});
