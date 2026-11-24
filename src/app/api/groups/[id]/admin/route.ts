import {
  deletePerson, getPeople, getPerson, getRevs, handle, HttpError, num, requireAdmin, saveMeta, str, toPublic,
} from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const meta = await requireAdmin(req, id);
  const [people, revs] = await Promise.all([getPeople(id), getRevs(id)]);
  return { ...revs, group: meta, participants: people.map(toPublic) };
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const meta = await requireAdmin(req, id);
  const b = await req.json().catch(() => ({}));
  if ("name" in b) meta.name = str(b.name, 80) || meta.name;
  if ("description" in b) meta.description = str(b.description, 600) || undefined;
  if ("eventPlace" in b) meta.eventPlace = str(b.eventPlace, 120) || undefined;
  if ("eventDate" in b) {
    const d = str(b.eventDate, 40);
    meta.eventDate = d && !isNaN(Date.parse(d)) ? new Date(d).toISOString() : undefined;
  }
  if ("budgetMin" in b) meta.budgetMin = num(b.budgetMin);
  if ("budgetMax" in b) meta.budgetMax = num(b.budgetMax);
  if ("exclusions" in b) {
    if (meta.drawnAt) throw new HttpError(409, "Refaça o sorteio para mudar as restrições");
    const ids = new Set((await getPeople(id)).map((p) => p.id));
    meta.exclusions = (Array.isArray(b.exclusions) ? b.exclusions : [])
      .filter((x: unknown): x is [string, string] => Array.isArray(x) && ids.has(x[0]) && ids.has(x[1]) && x[0] !== x[1])
      .slice(0, 200);
  }
  await saveMeta(meta);
  return { group: meta };
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const meta = await requireAdmin(req, id);
  const pid = new URL(req.url).searchParams.get("participant") ?? "";
  if (meta.drawnAt) throw new HttpError(409, "Refaça o sorteio antes de remover alguém");
  if (!(await getPerson(id, pid))) throw new HttpError(404, "Participante não encontrado");
  await deletePerson(id, pid);
  meta.exclusions = meta.exclusions.filter(([a, b]) => a !== pid && b !== pid);
  await saveMeta(meta);
  return { ok: true };
});
