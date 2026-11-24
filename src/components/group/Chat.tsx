"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { ChatMessage } from "@/lib/types";

/**
 * Chat anônimo. `me` diz qual lado eu sou na conversa:
 * - "santa": eu tirei a pessoa (ela não sabe quem eu sou)
 * - "giftee": alguém me tirou (eu não sei quem é)
 */
export function Chat({
  messages, me, otherLabel, onSend, placeholder,
}: {
  messages: ChatMessage[];
  me: "santa" | "giftee";
  otherLabel: string;
  onSend: (text: string) => Promise<void>;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={box} className="max-h-72 min-h-32 space-y-2 overflow-y-auto rounded-xl border border-line bg-ink p-3">
        {messages.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhuma mensagem ainda.</p>}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const mine = m.from === me;
            return (
              <motion.div
                key={`${m.at}-${i}`}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${mine ? "rounded-br-sm bg-berry text-white" : "rounded-bl-sm bg-ink-3"}`}>
                  {!mine && <div className="mb-0.5 text-[11px] font-bold text-gold">{otherLabel}</div>}
                  {m.text}
                  <div className="mt-0.5 text-right text-[10px] opacity-60">
                    {new Date(m.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setSending(true);
          try {
            await onSend(text.trim());
            setText("");
          } finally {
            setSending(false);
          }
        }}
      >
        <input className="input" maxLength={500} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" disabled={!text.trim()} loading={sending} className="shrink-0">
          Enviar
        </Button>
      </form>
    </div>
  );
}
