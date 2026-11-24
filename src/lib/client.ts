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

export const adminKey = {
  get: (gid: string) => (typeof window === "undefined" ? null : localStorage.getItem(aKey(gid))),
  set: (gid: string, k: string) => localStorage.setItem(aKey(gid), k),
};

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
