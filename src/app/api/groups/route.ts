import { groupId, handle, HttpError, num, saveMeta, str } from "@/lib/db";
import { nanoid } from "nanoid";
import { parseTheme } from "@/lib/theme";
import type { GroupMeta } from "@/lib/types";

export const POST = handle(async (req: Request) => {
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80);
  const organizerName = str(b.organizerName, 60);
  if (!name) throw new HttpError(400, "Dê um nome ao grupo");
  if (!organizerName) throw new HttpError(400, "Qual o seu nome?");
  let budgetMin = num(b.budgetMin);
  let budgetMax = num(b.budgetMax);
  if (budgetMin !== undefined && budgetMax !== undefined && budgetMin > budgetMax) [budgetMin, budgetMax] = [budgetMax, budgetMin];
  const eventDate = str(b.eventDate, 40);
  const meta: GroupMeta = {
    id: groupId(),
    name,
    organizerName,
    description: str(b.description, 600) || undefined,
    eventDate: eventDate && !isNaN(Date.parse(eventDate)) ? new Date(eventDate).toISOString() : undefined,
    eventPlace: str(b.eventPlace, 120) || undefined,
    budgetMin,
    budgetMax,
    adminKey: nanoid(24),
    createdAt: Date.now(),
    exclusions: [],
    theme: parseTheme(b.theme),
  };
  await saveMeta(meta);
  return { id: meta.id, adminKey: meta.adminKey };
});
