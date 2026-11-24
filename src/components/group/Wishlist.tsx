"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { inBudget, money } from "@/lib/format";
import { suggestionsFor } from "@/lib/suggestions";
import type { PublicGroup, WishItem } from "@/lib/types";

const PRIORITY = { 3: "Quero muito", 2: "Gostaria", 1: "Tanto faz" } as const;
const PRIORITY_COLOR = { 3: "bg-berry", 2: "bg-gold", 1: "bg-muted" } as const;

function BudgetBadge({ price, group }: { price?: number; group: PublicGroup }) {
  const s = inBudget(price, group.budgetMin, group.budgetMax);
  if (!s) return null;
  const map = {
    ok: ["text-pine", "dentro do valor"],
    above: ["text-berry", "acima do valor"],
    below: ["text-sky-400", "abaixo do mínimo"],
  } as const;
  return <span className={`text-xs font-semibold ${map[s][0]}`}>{map[s][1]}</span>;
}

export function WishCard({ item, group, onRemove, index = 0 }: { item: WishItem; group: PublicGroup; onRemove?: () => void; index?: number }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 320, damping: 28, delay: index * 0.03 }}
      className="flex items-start gap-3 rounded-xl border border-line bg-ink p-3"
    >
      <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_COLOR[item.priority]}`} title={PRIORITY[item.priority]} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-semibold">{item.title}</span>
          {item.price !== undefined && <span className="font-display text-gold">{money(item.price)}</span>}
          <BudgetBadge price={item.price} group={group} />
        </div>
        {item.note && <p className="text-sm text-muted">{item.note}</p>}
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-gold underline underline-offset-2 hover:text-cream">
            ver na loja
          </a>
        )}
      </div>
      {onRemove && (
        <button onClick={onRemove} className="px-1 text-lg leading-none text-muted hover:text-berry" aria-label="Remover">
          ×
        </button>
      )}
    </motion.li>
  );
}

export function WishlistEditor({ items, group, onChange }: { items: WishItem[]; group: PublicGroup; onChange: (items: WishItem[]) => Promise<void> }) {
  const empty = { title: "", price: "", link: "", note: "", priority: 2 as 1 | 2 | 3 };
  const [f, setF] = useState(empty);
  const [open, setOpen] = useState(items.length === 0);
  const [showIdeas, setShowIdeas] = useState(false);
  const [saving, setSaving] = useState(false);
  const ideas = suggestionsFor(group.budgetMin, group.budgetMax);

  async function save(next: WishItem[]) {
    setSaving(true);
    try {
      await onChange(next);
    } finally {
      setSaving(false);
    }
  }

  async function add(e?: React.FormEvent) {
    e?.preventDefault();
    if (!f.title.trim()) return;
    const price = parseFloat(f.price.replace(",", "."));
    await save([
      ...items,
      {
        id: Math.random().toString(36).slice(2, 10),
        title: f.title.trim(),
        price: Number.isFinite(price) ? price : undefined,
        link: f.link.trim() || undefined,
        note: f.note.trim() || undefined,
        priority: f.priority,
      },
    ]);
    setF(empty);
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <WishCard key={it.id} item={it} group={group} index={i} onRemove={() => save(items.filter((x) => x.id !== it.id))} />
          ))}
        </AnimatePresence>
      </ul>
      {items.length === 0 && <p className="text-sm text-muted">Lista vazia por enquanto.</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant={open ? "ghost" : "red"} onClick={() => setOpen(!open)}>
          {open ? "Fechar" : "Adicionar presente"}
        </Button>
        <Button variant="ghost" onClick={() => setShowIdeas(!showIdeas)}>
          {showIdeas ? "Esconder ideias" : "Ver ideias"}
        </Button>
      </div>

      <AnimatePresence>
        {showIdeas && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="mb-2 text-sm text-muted">Ideias dentro do valor do grupo (preço aproximado). Toque para adicionar.</p>
            <div className="flex flex-wrap gap-2">
              {ideas.map((s) => (
                <button
                  key={s.title}
                  disabled={saving || items.some((x) => x.title === s.title)}
                  onClick={() => save([...items, { id: Math.random().toString(36).slice(2, 10), title: s.title, price: s.price, priority: 2 }])}
                  className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-gold disabled:opacity-30"
                >
                  {s.title} <span className="text-muted">{money(s.price)}</span>
                </button>
              ))}
              {ideas.length === 0 && <span className="text-sm text-muted">Nenhuma ideia nessa faixa de preço.</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={add}
            className="space-y-3 overflow-hidden rounded-xl border border-line bg-ink p-4"
          >
            <Field label="O que você quer ganhar?">
              <input className="input" placeholder="Fone bluetooth" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço (R$)">
                <input className="input" inputMode="decimal" placeholder="0,00" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
              </Field>
              <Field label="Link">
                <input className="input" placeholder="opcional" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
              </Field>
            </div>
            <Field label="Detalhes">
              <input className="input" placeholder="Cor, tamanho, modelo" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {([3, 2, 1] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setF({ ...f, priority: p })}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${f.priority === p ? "border-cream bg-cream text-ink" : "border-line hover:border-muted"}`}
                >
                  <span className={`h-2 w-2 rounded-full ${PRIORITY_COLOR[p]}`} />
                  {PRIORITY[p]}
                </button>
              ))}
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={!f.title.trim()} loading={saving}>
              Adicionar
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WishlistView({ items, group }: { items: WishItem[]; group: PublicGroup }) {
  if (!items.length) return <p className="text-sm text-muted">Ainda não colocou nada. Dá pra perguntar pelo chat.</p>;
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  return (
    <ul className="space-y-2">
      {sorted.map((it, i) => (
        <WishCard key={it.id} item={it} group={group} index={i} />
      ))}
    </ul>
  );
}
