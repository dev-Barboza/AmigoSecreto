import { Redis } from "@upstash/redis";
import { createClient } from "redis";

/**
 * Camada mínima de armazenamento.
 * - Na Vercel: Upstash Redis (variáveis KV_REST_API_* ou UPSTASH_REDIS_REST_*)
 *   ou qualquer Redis com URL redis:// (REDIS_URL ou STORAGE_URL, ex.: Redis Cloud).
 * - Local sem variáveis: memória (some ao reiniciar o servidor).
 */
export interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  del(...keys: string[]): Promise<void>;
  hget<T>(key: string, field: string): Promise<T | null>;
  hset(key: string, field: string, value: unknown): Promise<void>;
  hgetall<T>(key: string): Promise<Record<string, T>>;
  hdel(key: string, field: string): Promise<void>;
  rpush(key: string, value: unknown): Promise<void>;
  lrange<T>(key: string): Promise<T[]>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redisUrl = process.env.REDIS_URL || process.env.STORAGE_URL;

function upstash(): KV {
  const r = new Redis({ url: url!, token: token! });
  return {
    get: (k) => r.get(k),
    set: async (k, v) => void (await r.set(k, v)),
    del: async (...k) => void (k.length && (await r.del(...k))),
    hget: (k, f) => r.hget(k, f),
    hset: async (k, f, v) => void (await r.hset(k, { [f]: v })),
    hgetall: async <T,>(k: string) => ((await r.hgetall<Record<string, T>>(k)) ?? {}),
    hdel: async (k, f) => void (await r.hdel(k, f)),
    rpush: async (k, v) => void (await r.rpush(k, v)),
    lrange: (k) => r.lrange(k, 0, -1),
    incr: async (k, ttl) => {
      const n = await r.incr(k);
      if (n === 1 && ttl) await r.expire(k, ttl);
      return n;
    },
  };
}

/** Redis via TCP (redis://). Valores guardados como JSON, igual ao cliente da Upstash. */
const newClient = (u: string) => createClient({ url: u });
type TcpClient = ReturnType<typeof newClient>;
const gr = globalThis as unknown as { __redis?: Promise<TcpClient> };

function tcp(u: string): KV {
  const conn = () =>
    (gr.__redis ??= (async () => {
      const c = newClient(u);
      c.on("error", (e) => console.error("Redis:", e));
      await c.connect();
      return c;
    })().catch((e) => {
      gr.__redis = undefined;
      throw e;
    }));
  const enc = (v: unknown) => JSON.stringify(v);
  const dec = <T,>(v: string | null | undefined): T | null => (v == null ? null : (JSON.parse(v) as T));
  return {
    get: async (k) => dec(await (await conn()).get(k)),
    set: async (k, v) => void (await (await conn()).set(k, enc(v))),
    del: async (...k) => void (k.length && (await (await conn()).del(k))),
    hget: async (k, f) => dec(await (await conn()).hGet(k, f)),
    hset: async (k, f, v) => void (await (await conn()).hSet(k, f, enc(v))),
    hgetall: async <T,>(k: string) => {
      const raw = (await (await conn()).hGetAll(k)) as Record<string, string>;
      return Object.fromEntries(Object.entries(raw).map(([f, v]) => [f, JSON.parse(v) as T]));
    },
    hdel: async (k, f) => void (await (await conn()).hDel(k, f)),
    rpush: async (k, v) => void (await (await conn()).rPush(k, enc(v))),
    lrange: async <T,>(k: string) => ((await (await conn()).lRange(k, 0, -1)) as string[]).map((v) => JSON.parse(v) as T),
    incr: async (k, ttl) => {
      const c = await conn();
      const n = await c.incr(k);
      if (n === 1 && ttl) await c.expire(k, ttl);
      return n;
    },
  };
}

type MemStore = Map<string, unknown>;
const g = globalThis as unknown as { __memkv?: MemStore };

function memory(): KV {
  const m: MemStore = (g.__memkv ??= new Map());
  const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  const hash = (k: string) => {
    if (!m.has(k)) m.set(k, {});
    return m.get(k) as Record<string, unknown>;
  };
  const list = (k: string) => {
    if (!m.has(k)) m.set(k, []);
    return m.get(k) as unknown[];
  };
  return {
    get: async (k) => clone((m.get(k) as never) ?? null),
    set: async (k, v) => void m.set(k, clone(v)),
    del: async (...k) => k.forEach((x) => m.delete(x)),
    hget: async (k, f) => clone((hash(k)[f] as never) ?? null),
    hset: async (k, f, v) => void (hash(k)[f] = clone(v)),
    hgetall: async (k) => clone(hash(k) as never),
    hdel: async (k, f) => void delete hash(k)[f],
    rpush: async (k, v) => void list(k).push(clone(v)),
    lrange: async (k) => clone(list(k) as never),
    incr: async (k) => {
      const n = ((m.get(k) as number) ?? 0) + 1;
      m.set(k, n);
      return n;
    },
  };
}

let instance: KV | null = null;
export function kv(): KV {
  if (instance) return instance;
  if (url && token) {
    instance = upstash();
  } else if (redisUrl) {
    instance = tcp(redisUrl);
  } else {
    if (process.env.VERCEL) {
      throw new Error(
        "Banco não configurado: conecte um Redis (Upstash ou Redis Cloud) no painel da Vercel (Storage) e faça o redeploy.",
      );
    }
    console.warn("Upstash não configurado: usando banco em memória (só para desenvolvimento).");
    instance = memory();
  }
  return instance;
}
