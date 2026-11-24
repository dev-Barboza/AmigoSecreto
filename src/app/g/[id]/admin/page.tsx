"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { LobbyMode } from "@/components/three/Lobby";
import { ThemePicker } from "@/components/group/ThemePicker";
import { Avatar, boom, Button, Card, Field, Hat, Lobby3D, Logo, SnowCSS, Toast } from "@/components/ui";
import { parseTheme } from "@/lib/theme";
import { adminKey, api, recentGroups, usePolling } from "@/lib/client";
import { budgetLabel } from "@/lib/format";
import type { GroupMeta, PublicParticipant } from "@/lib/types";

type AdminData = { rev: number; group: GroupMeta; participants: PublicParticipant[] };

export default function AdminPage() {
  return (
    <Suspense>
      <Admin />
    </Suspense>
  );
}

function Admin() {
  const { id: gid } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [key, setKey] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [denied, setDenied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<LobbyMode>("idle");
  const [drawing, setDrawing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const rev = useRef(-1);

  // a chave chega pela URL na primeira vez e fica guardada no aparelho
  useEffect(() => {
    const k = search.get("k");
    if (k) {
      adminKey.set(gid, k);
      if (search.get("novo")) setIsNew(true);
      router.replace(`/g/${gid}/admin`);
    }
    setKey(k ?? adminKey.get(gid) ?? "");
  }, [gid, search, router]);

  const load = useCallback(
    async (force = false) => {
      if (!key) return;
      try {
        if (!force) {
          const r = await api<{ rev: number; unchanged?: boolean }>(`/api/groups/${gid}?rev=${rev.current}`);
          if (r.unchanged) return;
        }
        const d = await api<AdminData>(`/api/groups/${gid}/admin`, { admin: key });
        rev.current = d.rev;
        setData(d);
        setMode((m) => (m === "shuffle" ? m : d.group.drawnAt ? "party" : "idle"));
      } catch {
        setDenied(true);
      }
    },
    [gid, key],
  );

  useEffect(() => {
    if (key === null) return;
    if (!key) setDenied(true);
    else load(true);
  }, [key, load]);
  usePolling(() => load(), 8000);

  const groupName = data?.group.name;
  useEffect(() => {
    if (groupName) recentGroups.add(gid, groupName);
  }, [gid, groupName]);

  const call = async (path: string, method: string, body?: unknown) => {
    try {
      await api(`/api/groups/${gid}${path}`, { admin: key, method, body });
      await load(true);
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    }
  };

  async function draw() {
    setDrawing(true);
    setMode("shuffle");
    const [ok] = await Promise.all([call("/draw", "POST"), new Promise((r) => setTimeout(r, 4200))]);
    setDrawing(false);
    if (ok) {
      setMode("party");
      boom("big");
      setToast("Sorteio feito. Avise o pessoal para descobrir o amigo secreto.");
    } else setMode("idle");
  }

  if (denied)
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="max-w-sm space-y-4">
          <h1 className="font-display text-3xl font-semibold">Só quem organiza</h1>
          <p className="text-muted">Abra pelo link de organizador que apareceu quando você criou o grupo.</p>
          <Link href={`/g/${gid}`}>
            <Button>Ir para o grupo</Button>
          </Link>
        </div>
      </main>
    );

  if (!data)
    return (
      <main className="grid min-h-dvh place-items-center">
        <Hat className="h-12 w-12 animate-wiggle" />
      </main>
    );

  const { group, participants } = data;
  const drawn = !!group.drawnAt;
  const revealedCount = participants.filter((p) => p.revealedAt).length;
  const inviteUrl = typeof window !== "undefined" ? `${location.origin}/g/${gid}` : "";
  const adminUrl = typeof window !== "undefined" ? `${location.origin}/g/${gid}/admin?k=${key}` : "";

  const copy = async (text: string, msg: string) => {
    await navigator.clipboard.writeText(text);
    setToast(msg);
  };
  const shareInvite = async () => {
    const text = `Amigo secreto "${group.name}". Entra aqui e monta seu boneco:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Amigo secreto", text, url: inviteUrl });
        return;
      } catch {}
    }
    copy(`${text} ${inviteUrl}`, "Convite copiado.");
  };

  return (
    <main className="relative pb-20">
      <SnowCSS count={12} />
      <header className="relative z-10 mx-auto max-w-6xl px-5 pt-6">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href={`/g/${gid}`}>
            <Button variant="ghost" className="px-3 py-2 text-sm">
              Ver como participante
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-gold">Painel de quem organiza</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{group.name}</h1>
        <p className="mt-1 text-muted">{budgetLabel(group.budgetMin, group.budgetMax)}</p>
      </header>

      <AnimatePresence>
        {isNew && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 mx-auto mt-5 max-w-6xl px-5">
            <div className="rounded-[20px] border-2 border-gold/50 bg-gold/5 p-5">
              <h2 className="font-display text-2xl font-semibold">Grupo criado</h2>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-cream/90">
                <li>Entre você também, pelo botão “Ver como participante”.</li>
                <li>Mande o convite para o pessoal.</li>
                <li>Quando todo mundo tiver entrado, aperte “Sortear”.</li>
              </ol>
              <button onClick={() => setIsNew(false)} className="mt-3 text-sm font-semibold text-muted hover:text-cream">
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative mx-auto mt-6 max-w-6xl px-3 sm:px-5">
        <div className="relative h-[50vh] min-h-[340px] overflow-hidden rounded-[22px] border border-line">
          <Lobby3D people={participants} mode={mode} className="h-full w-full" theme={group.theme} />
          <AnimatePresence>
            {drawing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center">
                <motion.p
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="rounded-2xl bg-ink/80 px-6 py-3 font-display text-4xl font-semibold"
                >
                  Sorteando...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-5 flex justify-center">
            {!drawn ? (
              <Button variant="gold" className="px-8 py-4 text-xl" onClick={draw} loading={drawing} disabled={participants.length < 3}>
                Sortear
              </Button>
            ) : (
              <div className="rounded-xl bg-ink/80 px-5 py-2 font-semibold backdrop-blur">
                {revealedCount} de {participants.length} já descobriram o amigo secreto
              </div>
            )}
          </div>
        </div>
        {!drawn && participants.length < 3 && <p className="mt-2 text-center text-sm text-muted">O sorteio precisa de pelo menos 3 pessoas.</p>}
      </section>

      <section className="relative z-10 mx-auto mt-6 grid max-w-6xl gap-5 px-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-xl font-semibold">Convite</h2>
          <div className="flex gap-2">
            <input readOnly className="input text-sm" value={inviteUrl} onFocus={(e) => e.target.select()} />
            <Button variant="gold" onClick={shareInvite} className="shrink-0">
              Enviar
            </Button>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm text-muted">
              Para abrir este painel em outro aparelho, use o link de organizador. <strong className="text-cream">Não mande para o grupo.</strong>
            </p>
            <button onClick={() => copy(adminUrl, "Link de organizador copiado.")} className="mt-1 text-sm font-semibold text-gold hover:underline">
              Copiar link de organizador
            </button>
          </div>
        </Card>

        <Card delay={0.04}>
          <h2 className="mb-3 font-display text-xl font-semibold">Quem entrou ({participants.length})</h2>
          <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {participants.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-ink"
                >
                  <Avatar photo={p.photo} name={p.name} color={p.color} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">
                      {p.wishlist.length} na lista{drawn && (p.revealedAt ? "  ·  já descobriu" : "  ·  ainda não descobriu")}
                    </p>
                  </div>
                  {!drawn && (
                    <button
                      className="px-2 text-lg leading-none text-muted hover:text-berry"
                      aria-label={`Remover ${p.name}`}
                      onClick={() => confirm(`Tirar ${p.name} do grupo?`) && call(`/admin?participant=${p.id}`, "DELETE")}
                    >
                      ×
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
            {!participants.length && <p className="text-sm text-muted">Ninguém ainda. Manda o convite.</p>}
          </ul>
        </Card>

        <Exclusions group={group} people={participants} onSave={(exclusions) => call("/admin", "PATCH", { exclusions })} />
        <Settings group={group} onSave={(b) => call("/admin", "PATCH", b)} />

        {drawn && (
          <Card className="lg:col-span-2">
            <h2 className="font-display text-xl font-semibold">Refazer o sorteio</h2>
            <p className="mb-3 text-sm text-muted">Apaga o sorteio, quem já descobriu e as conversas. Use se alguém novo precisar entrar.</p>
            <Button
              variant="danger"
              onClick={() => confirm("Tem certeza? Todo mundo vai ter que descobrir o amigo secreto de novo.") && call("/draw", "DELETE").then(() => setMode("idle"))}
            >
              Desfazer sorteio
            </Button>
          </Card>
        )}
      </section>
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}

function Exclusions({ group, people, onSave }: { group: GroupMeta; people: PublicParticipant[]; onSave: (e: [string, string][]) => Promise<boolean> }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "?";
  const drawn = !!group.drawnAt;
  return (
    <Card delay={0.08}>
      <h2 className="font-display text-xl font-semibold">Quem não pode tirar quem</h2>
      <p className="mb-3 text-sm text-muted">Casais, irmãos, quem se tirou no ano passado.</p>
      <ul className="mb-3 space-y-1.5">
        {group.exclusions.map(([x, y], i) => (
          <li key={i} className="flex items-center justify-between rounded-xl border border-line bg-ink px-3 py-2 text-sm">
            <span>
              {name(x)} <span className="text-muted">e</span> {name(y)}
            </span>
            {!drawn && (
              <button className="text-lg leading-none text-muted hover:text-berry" onClick={() => onSave(group.exclusions.filter((_, j) => j !== i))}>
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {!drawn && people.length >= 2 && (
        <div className="flex flex-wrap gap-2">
          {[
            [a, setA],
            [b, setB],
          ].map(([v, set], i) => (
            <select key={i} className="input flex-1 py-2" value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)}>
              <option value="">Escolha</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ))}
          <Button
            variant="ghost"
            disabled={!a || !b || a === b}
            onClick={async () => {
              if (await onSave([...group.exclusions, [a, b]])) {
                setA("");
                setB("");
              }
            }}
          >
            Adicionar
          </Button>
        </div>
      )}
    </Card>
  );
}

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function Settings({ group, onSave }: { group: GroupMeta; onSave: (b: Record<string, unknown>) => Promise<boolean> }) {
  const [f, setF] = useState({
    name: group.name,
    budgetMin: group.budgetMin?.toString() ?? "",
    budgetMax: group.budgetMax?.toString() ?? "",
    eventDate: toLocalInput(group.eventDate),
    eventPlace: group.eventPlace ?? "",
    description: group.description ?? "",
    theme: parseTheme(group.theme),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Card delay={0.12}>
      <h2 className="mb-3 font-display text-xl font-semibold">Dados do grupo</h2>
      <div className="space-y-3">
        <Field label="Nome">
          <input className="input" value={f.name} onChange={set("name")} />
        </Field>
        <div className="space-y-1.5">
          <span className="text-sm font-semibold text-cream/90">Cenário</span>
          <ThemePicker compact value={f.theme} onChange={(theme) => setF({ ...f, theme })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mínimo (R$)">
            <input className="input" inputMode="decimal" value={f.budgetMin} onChange={set("budgetMin")} />
          </Field>
          <Field label="Máximo (R$)">
            <input className="input" inputMode="decimal" value={f.budgetMax} onChange={set("budgetMax")} />
          </Field>
        </div>
        <Field label="Dia da troca">
          <input className="input" type="datetime-local" value={f.eventDate} onChange={set("eventDate")} />
        </Field>
        <Field label="Local">
          <input className="input" value={f.eventPlace} onChange={set("eventPlace")} />
        </Field>
        <Field label="Recado">
          <textarea className="input min-h-20" value={f.description} onChange={set("description")} />
        </Field>
        <Button
          loading={saving}
          onClick={async () => {
            setSaving(true);
            await onSave({ ...f, eventDate: f.eventDate ? new Date(f.eventDate).toISOString() : "" });
            setSaving(false);
          }}
        >
          Salvar
        </Button>
      </div>
    </Card>
  );
}
