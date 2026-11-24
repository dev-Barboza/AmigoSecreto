import { getPeople, handle, hashPin, HttpError, rateLimit, str } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const pid = str(b.participantId, 30);
  await rateLimit(id, `login:${pid}`, 8, 900);
  const people = await getPeople(id);
  const p = people.find((x) => x.id === pid);
  if (!p || p.pinHash !== hashPin(id, String(b.pin ?? ""))) throw new HttpError(401, "PIN incorreto");
  return { participantId: p.id, token: p.token };
});
