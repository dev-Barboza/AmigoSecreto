import { createHash, timingSafeEqual } from "crypto";
import { customAlphabet, nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { kv } from "./kv";
import type { ChatMessage, GroupMeta, Participant, PublicGroup, PublicParticipant, WishItem } from "./types";

export const groupId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);

const K = {
  meta: (g: string) => `g:${g}:meta`,
  people: (g: string) => `g:${g}:p`,
  pairs: (g: string) => `g:${g}:pairs`,
  chat: (g: string, santa: string) => `g:${g}:chat:${santa}`,
  rate: (g: string, what: string) => `g:${g}:rate:${what}`,
  rev: (g: string) => `g:${g}:rev`,
  chatRev: (g: string) => `g:${g}:chatrev`,
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
    if (!title) return [];
    const p = Number(it.priority);
    return [
      {
        id: str(it.id, 30) || nanoid(10),
        title,
        price: num(it.price),
        link: url(it.link),
        note: str(it.note, 300) || undefined,
        priority: (p === 1 || p === 2 || p === 3 ? p : 2) as 1 | 2 | 3,
      },
    ];
  });
}

// ---------- PIN ----------
export function hashPin(gid: string, pin: string) {
  return createHash("sha256")
    .update(`${process.env.PIN_SECRET ?? "amigo-secreto"}:${gid}:${pin}`)
    .digest("hex");
}
export function validPin(pin: unknown) {
  return typeof pin === "string" && /^\d{4,6}$/.test(pin);
}
function safeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
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
  await bumpRev(gid);
}
export async function deletePerson(gid: string, pid: string) {
  await kv().hdel(K.people(gid), pid);
  await bumpRev(gid);
}

export const getPairs = (gid: string) => kv().hgetall<string>(K.pairs(gid));
export async function savePairs(gid: string, pairs: Record<string, string>) {
  await kv().del(K.pairs(gid));
  for (const [santa, giftee] of Object.entries(pairs)) await kv().hset(K.pairs(gid), santa, giftee);
}
export async function clearDraw(gid: string, peopleIds: string[]) {
  await kv().del(K.pairs(gid), ...peopleIds.map((p) => K.chat(gid, p)));
  await bumpChatRev(gid);
}

export const getChat = (gid: string, santa: string) => kv().lrange<ChatMessage>(K.chat(gid, santa));
export async function pushChat(gid: string, santa: string, m: ChatMessage) {
  await kv().rpush(K.chat(gid, santa), m);
  await bumpChatRev(gid);
}

// ---------- versões (o cliente só baixa tudo de novo quando algo muda) ----------
export const bumpRev = (gid: string) => kv().incr(K.rev(gid));
export const bumpChatRev = (gid: string) => kv().incr(K.chatRev(gid));
export async function getRevs(gid: string) {
  const [rev, chatRev] = await Promise.all([kv().get<number>(K.rev(gid)), kv().get<number>(K.chatRev(gid))]);
  return { rev: Number(rev ?? 0), chatRev: Number(chatRev ?? 0) };
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
