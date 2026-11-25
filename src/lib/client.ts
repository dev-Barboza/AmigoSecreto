"use client";

import { useEffect, useRef } from "react";

export type Session = { participantId: string; token: string };

const sKey = (gid: string) => `as:session:${gid}`;
const aKey = (gid: string) => `as:admin:${gid}`;

export const session = {
  get(gid: string): Session | null {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem(sKey(gid)) ?? "null");
    } catch {
      return null;
    }
  },
  set: (gid: string, s: Session) => localStorage.setItem(sKey(gid), JSON.stringify(s)),
  clear: (gid: string) => localStorage.removeItem(sKey(gid)),
};

/**
 * Quem a pessoa tirou, guardado só neste aparelho depois de abrir com a senha.
 * Vale só para o sorteio atual (se o sorteio for refeito, drawnAt muda e isso é ignorado).
 */
export type MatchRef = { id: string; drawnAt?: number };
const mKey = (gid: string) => `as:match:${gid}`;
export const matchStore = {
  get(gid: string, drawnAt?: number): string | null {
    if (typeof window === "undefined" || !drawnAt) return null;
    try {
      const v = JSON.parse(localStorage.getItem(mKey(gid)) ?? "null") as MatchRef | null;
      return v && v.drawnAt === drawnAt ? v.id : null;
    } catch {
      return null;
    }
  },
  set: (gid: string, m?: MatchRef) => m && localStorage.setItem(mKey(gid), JSON.stringify(m)),
  clear: (gid: string) => localStorage.removeItem(mKey(gid)),
};

export const adminKey = {
  get: (gid: string) => (typeof window === "undefined" ? null : localStorage.getItem(aKey(gid))),
  set: (gid: string, k: string) => localStorage.setItem(aKey(gid), k),
};

/** Grupos que este aparelho já abriu, para achar de novo pela página inicial. */
export type RecentGroup = { id: string; name: string; at: number };
const rKey = "as:groups";
export const recentGroups = {
  list(): RecentGroup[] {
    if (typeof window === "undefined") return [];
    try {
      return (JSON.parse(localStorage.getItem(rKey) ?? "[]") as RecentGroup[]).sort((a, b) => b.at - a.at);
    } catch {
      return [];
    }
  },
  add(id: string, name: string) {
    const rest = recentGroups.list().filter((g) => g.id !== id);
    localStorage.setItem(rKey, JSON.stringify([{ id, name, at: Date.now() }, ...rest].slice(0, 10)));
  },
};

/** Aceita o link inteiro do grupo ou só o código (ex.: "wbbzvpkh"). */
export function groupIdFrom(input: string): string | null {
  const t = input.trim();
  const m = t.match(/\/g\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{4,30}$/.test(t) ? t : null;
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; gid?: string; admin?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.gid) {
    const s = session.get(opts.gid);
    if (s) {
      headers["x-participant"] = s.participantId;
      headers.authorization = `Bearer ${s.token}`;
    }
  }
  if (opts.admin) headers["x-admin-key"] = opts.admin;
  const res = await fetch(path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Algo deu errado"), { status: res.status });
  return data as T;
}

/** Recorta a foto em quadrado, reduz e comprime para caber no banco. */
export function resizePhoto(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Não consegui ler essa imagem"));
    img.src = url;
  });
}

/**
 * Roda `fn` a cada `ms`, mas só com a aba visível. Ao voltar para a aba, roda na hora.
 * Economiza bastante requisição quando o celular está bloqueado ou em outra aba.
 */
export function usePolling(fn: () => void, ms = 8000) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && ref.current();
    const i = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms]);
}
