"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { boom, Button, Card, Field, Logo, SnowCSS, Toast } from "@/components/ui";
import { adminKey, api } from "@/lib/client";
import { budgetLabel } from "@/lib/format";

const PRESETS = [
  [null, 50],
  [50, 100],
  [100, 150],
  [150, 250],
] as const;

export default function Criar() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({
    name: "",
    organizerName: "",
    eventDate: "",
    eventPlace: "",
    budgetMin: "",
    budgetMax: "",
    description: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const steps = [
    {
      title: "Qual é o grupo?",
      ok: f.name.trim() && f.organizerName.trim(),
      body: (
        <>
          <Field label="Nome do grupo">
            <input className="input" autoFocus placeholder="Família Silva, Firma, Turma do vôlei..." value={f.name} onChange={set("name")} />
          </Field>
          <Field label="Seu nome" hint="Você vai ser quem organiza e aperta o botão do sorteio.">
            <input className="input" placeholder="Seu nome" value={f.organizerName} onChange={set("organizerName")} />
          </Field>
        </>
      ),
    },
    {
      title: "Quanto vale o presente?",
      ok: true,
      body: (
        <>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(([min, max]) => {
              const active = f.budgetMin === String(min ?? "") && f.budgetMax === String(max);
              return (
                <button
                  type="button"
                  key={`${min}-${max}`}
                  onClick={() => setF({ ...f, budgetMin: min ? String(min) : "", budgetMax: String(max) })}
                  className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${active ? "border-gold bg-gold/10 text-gold" : "border-line hover:border-muted"}`}
                >
                  {budgetLabel(min ?? undefined, max)}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mínimo (R$)">
              <input className="input" inputMode="decimal" placeholder="opcional" value={f.budgetMin} onChange={set("budgetMin")} />
            </Field>
            <Field label="Máximo (R$)">
              <input className="input" inputMode="decimal" placeholder="opcional" value={f.budgetMax} onChange={set("budgetMax")} />
            </Field>
          </div>
        </>
      ),
    },
    {
      title: "Quando e onde?",
      ok: true,
      body: (
        <>
          <Field label="Dia e hora da troca" hint="Aparece uma contagem regressiva na página do grupo.">
            <input className="input" type="datetime-local" value={f.eventDate} onChange={set("eventDate")} />
          </Field>
          <Field label="Local">
            <input className="input" placeholder="Casa da vó" value={f.eventPlace} onChange={set("eventPlace")} />
          </Field>
          <Field label="Recado para o grupo">
            <textarea className="input min-h-24" placeholder="Cada um leva um prato de doce." value={f.description} onChange={set("description")} />
          </Field>
        </>
      ),
    },
  ];

  async function create() {
    setLoading(true);
    try {
      const body = { ...f, eventDate: f.eventDate ? new Date(f.eventDate).toISOString() : "" };
      const res = await api<{ id: string; adminKey: string }>("/api/groups", { body });
      adminKey.set(res.id, res.adminKey);
      boom("big");
      setTimeout(() => router.push(`/g/${res.id}/admin?k=${res.adminKey}&novo=1`), 900);
    } catch (e) {
      setErr((e as Error).message);
      setLoading(false);
    }
  }

  const cur = steps[step];
  return (
    <main className="relative min-h-dvh px-5 py-6">
      <SnowCSS count={20} />
      <Logo />
      <div className="mx-auto mt-10 max-w-lg">
        <p className="mb-3 text-sm font-semibold text-muted">
          Passo {step + 1} de {steps.length}
        </p>
        <div className="mb-6 flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-3">
              <motion.div className="h-full bg-gold" animate={{ width: i <= step ? "100%" : "0%" }} />
            </div>
          ))}
        </div>
        <Card>
          <AnimatePresence mode="wait">
            <motion.form
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!cur.ok) return;
                if (step < steps.length - 1) setStep(step + 1);
                else create();
              }}
            >
              <h1 className="font-display text-3xl font-semibold">{cur.title}</h1>
              {cur.body}
              <div className="flex justify-between gap-3 pt-2">
                {step > 0 ? (
                  <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                    Voltar
                  </Button>
                ) : (
                  <span />
                )}
                <Button type="submit" variant={step === steps.length - 1 ? "gold" : "red"} disabled={!cur.ok} loading={loading}>
                  {step === steps.length - 1 ? "Criar grupo" : "Continuar"}
                </Button>
              </div>
            </motion.form>
          </AnimatePresence>
        </Card>
      </div>
      <Toast message={err} onDone={() => setErr(null)} />
    </main>
  );
}
