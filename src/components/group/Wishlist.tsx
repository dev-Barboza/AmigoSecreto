"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui";
import { siteName } from "@/lib/format";
import { suggestionsFor } from "@/lib/suggestions";
import type { PublicGroup, WishItem } from "@/lib/types";

const newId = () => Math.random().toString(36).slice(2, 10);

/** Um item da lista: nome, link, ou os dois. */
export function WishCard({ item, onRemove }: { item: WishItem; onRemove?: () => void }) {
  const title = item.title || (item.link ? `Lista em ${siteName(item.link)}` : "");
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex items-center gap-3 rounded-xl border border-line bg-ink px-4 py-3"
    >
      <span className="min-w-0 flex-1 truncate font-semibold">{title}</span>
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-semibold text-gold underline underline-offset-2 hover:text-cream"
        >
          {item.title ? "ver link" : "abrir lista"}
        </a>
      )}
      {onRemove && (
        <button onClick={onRemove} className="shrink-0 px-1 text-lg leading-none text-muted hover:text-berry" aria-label="Remover">
          ×
        </button>
      )}
    </motion.li>
  );
}

export function WishlistEditor({ items, group, onChange }: { items: WishItem[]; group: PublicGroup; onChange: (items: WishItem[]) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [showIdeas, setShowIdeas] = useState(false);
  const [saving, setSaving] = useState(false);
  const ideas = suggestionsFor(group.budgetMin, group.budgetMax);
  const canAdd = !!(title.trim() || link.trim());

  async function save(next: WishItem[]) {
    setSaving(true);
    try {
      await onChange(next);
    } finally {
      setSaving(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdd) return;
    await save([...items, { id: newId(), title: title.trim(), link: link.trim() || undefined, priority: 2 }]);
    setTitle("");
    setLink("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="space-y-3 rounded-xl border border-line bg-ink p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-cream/90">Presente</span>
            <input className="input" placeholder="Ex.: fone bluetooth" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-cream/90">Link</span>
            <input className="input" inputMode="url" placeholder="Amazon, Mercado Livre, Shopee..." value={link} onChange={(e) => setLink(e.target.value)} />
          </label>
        </div>
        <p className="text-xs text-muted">Preencha um dos dois ou os dois. Se já tem uma lista pronta em outro site, cola só o link dela.</p>
        <Button type="submit" variant="gold" className="w-full sm:w-auto" disabled={!canAdd} loading={saving}>
          Adicionar
        </Button>
      </form>

      {items.length > 0 ? (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((it) => (
              <WishCard key={it.id} item={it} onRemove={() => save(items.filter((x) => x.id !== it.id))} />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="text-sm text-muted">Lista vazia por enquanto.</p>
      )}

      <div>
        <button onClick={() => setShowIdeas(!showIdeas)} className="text-sm font-semibold text-muted underline-offset-4 hover:text-cream hover:underline">
          {showIdeas ? "Esconder ideias" : "Sem ideia? Ver sugestões"}
        </button>
        <AnimatePresence>
          {showIdeas && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap gap-2 pt-3">
                {ideas.map((s) => (
                  <button
                    key={s.title}
                    disabled={saving || items.some((x) => x.title === s.title)}
                    onClick={() => save([...items, { id: newId(), title: s.title, priority: 2 }])}
                    className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-gold disabled:opacity-30"
                  >
                    {s.title}
                  </button>
                ))}
                {ideas.length === 0 && <span className="text-sm text-muted">Nenhuma sugestão nessa faixa de valor.</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function WishlistView({ items }: { items: WishItem[]; group?: PublicGroup }) {
  if (!items.length) return <p className="text-sm text-muted">Ainda não colocou nada na lista.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <WishCard key={it.id} item={it} />
      ))}
    </ul>
  );
}
