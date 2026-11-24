"use client";

import { THEMES, type Theme } from "@/lib/theme";

/** Escolha do cenário do lobby (Natal ou Tribunal). */
export function ThemePicker({ value, onChange, compact }: { value: Theme; onChange: (t: Theme) => void; compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
      {THEMES.map((t) => {
        const active = value === t.id;
        return (
          <button
            type="button"
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`rounded-xl border-2 px-4 py-3 text-left transition ${active ? "border-gold bg-gold/10" : "border-line hover:border-muted"}`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="text-xl">{t.icon}</span>
              <span className={active ? "text-gold" : ""}>{t.label}</span>
            </span>
            {!compact && <span className="mt-1 block text-sm text-muted">{t.desc}</span>}
          </button>
        );
      })}
    </div>
  );
}
