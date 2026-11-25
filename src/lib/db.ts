import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { customAlphabet, nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { kv } from "./kv";
import type { GroupMeta, Participant, PublicGroup, PublicParticipant, WishItem } from "./types";

export const groupId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);

const K = {
  meta: (g: string) => `g:${g}:meta`,
  people: (g: string) => `g:${g}:p`,
  pairs: (g: string) => `g:${g}:pairs`,
  rate: (g: string, what: string) => `g:${g}:rate:${what}`,
  rev: (g: string) => `g:${g}:rev`,
  indexed: (g: string) => `g:${g}:indexed`,
  /** nome normalizado -> { grupo: participante }, para entrar só com nome e senha */
  byName: (n: string) => `n:${n}`,
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function handle<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A) => {
    try {
      const data = await fn(...args);
      return NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      const msg = e instanceof Error ? e.message : "Erro inesperado";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}

// ---------- sanitização ----------
export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
};
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
export const color = (v: unknown, fallback = "#e11d48") => (typeof v === "string" && COLOR_RE.test(v) ? v : fallback);
export const photo = (v: unknown) => {
  if (v === null || v === "") return undefined;
  if (typeof v !== "string") return undefined;
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(v)) throw new HttpError(400, "Foto inválida");
  if (v.length > 300_000) throw new HttpError(400, "Foto muito grande");
  return v;
};
const url = (v: unknown) => {
  const s = str(v, 500);
  if (!s) return undefined;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    return new URL(withProto).toString();
  } catch {
    return undefined;
  }
};

export function cleanWishlist(v: unknown): WishItem[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 30).flatMap((raw) => {
    const it = raw as Record<string, unknown>;
    const title = str(it.title, 120);
    const link = url(it.link);
    if (!title && !link) return [];
    const p = Number(it.priority);
    return [
      {
        id: str(it.id, 30) || nanoid(10),
        title,
        price: num(it.price),
        link,
        note: str(it.note, 300) || undefined,
        priority: (p === 1 || p === 2 || p === 3 ? p : 2) as 1 | 2 | 3,
      },
    ];
  });
}

// ---------- nome e senha ----------
/** "  José  da Silva " e "jose da silva" viram a mesma coisa. */
export function normName(name: string) {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Formato antigo (PIN): sha256 com segredo. Continua aceito para quem entrou antes. */
function legacyHash(gid: string, pin: string) {
  return createHash("sha256")
    .update(`${process.env.PIN_SECRET ?? "amigo-secreto"}:${gid}:${pin}`)
    .digest("hex");
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `s1$${salt}$${scryptSync(password, salt, 32).toString("hex")}`;
}
export function checkPassword(gid: string, password: string, stored: string) {
  if (stored.startsWith("s1$")) {
    const [, salt, hash] = stored.split("$");
    return safeEq(scryptSync(password, salt, 32).toString("hex"), hash);
  }
  return safeEq(legacyHash(gid, password), stored);
}
export function validPassword(pw: unknown): pw is string {
  return typeof pw === "string" && pw.length >= 4 && pw.length <= 64;
}
function safeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Todos os lugares (grupo + participante) onde existe alguém com esse nome. */
export async function findByName(name: string) {
  const all = await kv().hgetall<string>(K.byName(normName(name)));
  return Object.entries(all).map(([gid, pid]) => ({ gid, pid }));
}
/** Indexa quem entrou antes do índice existir (roda uma vez por grupo). */
export async function ensureIndexed(gid: string, people: Participant[]) {
  if (await kv().get(K.indexed(gid))) return;
  for (const p of people) await kv().hset(K.byName(normName(p.name)), gid, p.id);
  await kv().set(K.indexed(gid), 1);
}

export async function rateLimit(gid: string, what: string, max: number, ttl = 600) {
  const n = await kv().incr(K.rate(gid, what), ttl);
  if (n > max) throw new HttpError(429, "Muitas tentativas. Espere alguns minutos e tente de novo.");
}

// ---------- leitura ----------
export const toPublic = ({ pinHash: _p, token: _t, ...rest }: Participant): PublicParticipant => rest;
export const groupPublic = ({ adminKey: _a, ...rest }: GroupMeta): PublicGroup => rest;

export async function getMeta(gid: string) {
  const meta = await kv().get<GroupMeta>(K.meta(gid));
  if (!meta) throw new HttpError(404, "Grupo não encontrado");
  return meta;
}
export async function saveMeta(meta: GroupMeta) {
  await kv().set(K.meta(meta.id), meta);
  await bumpRev(meta.id);
}

export async function getPeople(gid: string) {
  const all = await kv().hgetall<Participant>(K.people(gid));
  return Object.values(all).sort((a, b) => a.joinedAt - b.joinedAt);
}
export const getPerson = (gid: string, pid: string) => kv().hget<Participant>(K.people(gid), pid);
export async function savePerson(gid: string, p: Participant) {
  await kv().hset(K.people(gid), p.id, p);
  await kv().hset(K.byName(normName(p.name)), gid, p.id);
  await bumpRev(gid);
}
export async function deletePerson(gid: string, pid: string) {
  const p = await getPerson(gid, pid);
  if (p) await kv().hdel(K.byName(normName(p.name)), gid);
  await kv().hdel(K.people(gid), pid);
  await bumpRev(gid);
}

export const getPairs = (gid: string) => kv().hgetall<string>(K.pairs(gid));
export async function savePairs(gid: string, pairs: Record<string, string>) {
  await kv().del(K.pairs(gid));
  for (const [santa, giftee] of Object.entries(pairs)) await kv().hset(K.pairs(gid), santa, giftee);
}
export async function clearDraw(gid: string, peopleIds: string[]) {
  await kv().del(K.pairs(gid));
}

// ---------- versões (o cliente só baixa tudo de novo quando algo muda) ----------
export const bumpRev = (gid: string) => kv().incr(K.rev(gid));
export async function getRevs(gid: string) {
  const rev = await kv().get<number>(K.rev(gid));
  return { rev: Number(rev ?? 0) };
}

// ---------- auth ----------
export async function requireParticipant(req: Request, gid: string) {
  const pid = req.headers.get("x-participant") ?? "";
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!pid || !token) throw new HttpError(401, "Entre no grupo primeiro");
  const p = await getPerson(gid, pid);
  if (!p || !safeEq(p.token, token)) throw new HttpError(401, "Sessão inválida, entre novamente");
  return p;
}

export async function requireAdmin(req: Request, gid: string) {
  const key = req.headers.get("x-admin-key") ?? "";
  const meta = await getMeta(gid);
  if (!key || !safeEq(meta.adminKey, key)) throw new HttpError(403, "Chave de organizador inválida");
  return meta;
}

export const newToken = () => nanoid(32);
