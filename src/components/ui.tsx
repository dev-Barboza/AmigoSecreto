"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// ---------- cenas 3D (só no navegador) ----------
const Loading3D = () => (
  <div className="grid h-full w-full place-items-center bg-ink">
    <Hat className="h-10 w-10 animate-wiggle" />
  </div>
);
export const Lobby3D = dynamic(() => import("./three/Lobby"), { ssr: false, loading: Loading3D });
export const Preview3D = dynamic(() => import("./three/Preview"), { ssr: false, loading: Loading3D });
export const Reveal3D = dynamic(() => import("./three/Reveal"), { ssr: false, loading: Loading3D });

// ---------- marca ----------
export function Hat({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M14 46 L34 12 Q44 22 50 46 Z" fill="#d94a3d" />
      <rect x="10" y="42" width="44" height="10" rx="5" fill="#f4ecdf" />
      <circle cx="34" cy="11" r="6" fill="#f4ecdf" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-display text-lg font-semibold text-cream">
      <Hat className="h-7 w-7" />
      amigo secreto
    </Link>
  );
}

// ---------- botões e blocos ----------
type BtnProps = HTMLMotionProps<"button"> & { variant?: "red" | "gold" | "ghost" | "danger"; loading?: boolean };

export function Button({ variant = "red", loading, className = "", children, disabled, ...rest }: BtnProps) {
  return (
    <motion.button disabled={disabled || loading} className={`btn btn-${variant} ${className}`} {...rest}>
      {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children as React.ReactNode}
    </motion.button>
  );
}

export function Card({ className = "", children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24, delay }}
      className={`panel p-5 sm:p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-cream/90">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 60, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 60, opacity: 0, x: "-50%" }}
          className="fixed bottom-6 left-1/2 z-50 max-w-[90vw] rounded-xl bg-cream px-4 py-3 text-sm font-semibold text-ink shadow-xl"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- efeitos ----------
export function SnowCSS({ count = 30 }: { count?: number }) {
  const [flakes, setFlakes] = useState<{ left: number; size: number; dur: number; delay: number; drift: number; op: number }[]>([]);
  useEffect(() => {
    setFlakes(
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        dur: 10 + Math.random() * 14,
        delay: -Math.random() * 24,
        drift: (Math.random() - 0.5) * 100,
        op: 0.15 + Math.random() * 0.4,
      })),
    );
  }, [count]);
  return (
    <div aria-hidden>
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={{
            left: `${f.left}vw`,
            opacity: f.op,
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
            ["--s" as string]: `${f.size}px`,
            ["--drift" as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

const PARTY = ["#d94a3d", "#f0b54a", "#3e8e5e", "#f4ecdf"];
export function boom(intensity: "small" | "big" = "big") {
  if (intensity === "small") {
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: PARTY });
    return;
  }
  const end = Date.now() + 1500;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: PARTY });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: PARTY });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 140, spread: 110, startVelocity: 42, origin: { y: 0.55 }, colors: PARTY });
}

export function Countdown({ to }: { to?: string }) {
  const target = useMemo(() => (to ? new Date(to).getTime() : 0), [to]);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  if (!to || now === null) return null;
  const diff = Math.max(0, target - now);
  if (diff === 0) return <div className="font-display text-lg text-gold">É hoje!</div>;
  const parts = [
    ["dias", Math.floor(diff / 86400000)],
    ["h", Math.floor(diff / 3600000) % 24],
    ["min", Math.floor(diff / 60000) % 60],
    ["s", Math.floor(diff / 1000) % 60],
  ] as const;
  return (
    <div className="flex items-baseline gap-3 font-display tabular-nums">
      <span className="text-sm text-muted">faltam</span>
      {parts.map(([label, v]) => (
        <span key={label} className="text-2xl font-semibold">
          {String(v).padStart(2, "0")}
          <span className="ml-0.5 text-xs font-normal text-muted">{label}</span>
        </span>
      ))}
    </div>
  );
}

/** Avatar redondo (foto ou inicial) para listas. */
export function Avatar({ photo, name, color, size = 40 }: { photo?: string; name?: string; color: string; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-semibold text-white"
      style={{ width: size, height: size, background: color, border: `2px solid ${color}`, fontSize: size * 0.42 }}
    >
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : (name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

/** Abas com um marcador que desliza. */
export function Tabs<T extends string>({ items, value, onChange, id }: { items: [T, string][]; value: T; onChange: (v: T) => void; id: string }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-line bg-ink-2 p-1">
      {items.map(([k, label]) => (
        <button key={k} onClick={() => onChange(k)} className="relative rounded-xl px-4 py-2 text-sm font-semibold">
          {value === k && <motion.span layoutId={id} className="absolute inset-0 rounded-xl bg-cream" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
          <span className={`relative ${value === k ? "text-ink" : "text-muted hover:text-cream"}`}>{label}</span>
        </button>
      ))}
    </div>
  );
}
