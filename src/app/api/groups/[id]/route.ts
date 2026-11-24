import { getMeta, getPeople, getRevs, groupPublic, handle, toPublic } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// ?rev=N&chatRev=M: se nada mudou, responde só as versões (1 leitura barata em vez do grupo inteiro com fotos)
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const q = new URL(req.url).searchParams;
  const revs = await getRevs(id);
  if (q.get("rev") === String(revs.rev)) return { ...revs, unchanged: true };
  const [meta, people] = await Promise.all([getMeta(id), getPeople(id)]);
  return { ...revs, group: groupPublic(meta), participants: people.map(toPublic) };
});
