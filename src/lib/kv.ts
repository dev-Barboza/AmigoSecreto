import { Redis } from "@upstash/redis";

/**
 * Camada mínima de armazenamento.
 * - Na Vercel: Upstash Redis (variáveis KV_REST_API_* ou UPSTASH_REDIS_REST_*).
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
  } else {
    if (process.env.VERCEL) {
      throw new Error(
        "Banco não configurado: conecte o Upstash Redis no painel da Vercel (Storage) e faça o redeploy.",
      );
    }
    console.warn("Upstash não configurado: usando banco em memória (só para desenvolvimento).");
    instance = memory();
  }
  return instance;
}
