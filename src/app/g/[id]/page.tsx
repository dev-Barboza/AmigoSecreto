"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chat } from "@/components/group/Chat";
import { ColorPicker, JoinFlow, LoginFlow, PhotoPicker } from "@/components/group/Join";
import { WishlistEditor, WishlistView } from "@/components/group/Wishlist";
import { Avatar, boom, Button, Card, Countdown, Field, Hat, Lobby3D, Logo, Reveal3D, SnowCSS, Tabs, Toast } from "@/components/ui";
import { adminKey, api, recentGroups, session, usePolling } from "@/lib/client";
import { budgetLabel, dateLabel } from "@/lib/format";
import type { MeResponse, PublicGroup, PublicParticipant } from "@/lib/types";

type GroupData = { group: PublicGroup; participants: PublicParticipant[] };
type Poll = { rev: number; chatRev: number; unchanged?: boolean } & Partial<GroupData>;
type Tab = "match" | "list" | "char" | "santa";

const TAP_TEXT = ["Toque para descobrir", "De novo", "Quase lá..."];

export default function GroupPage() {
  const { id: gid } = useParams<{ id: string }>();
  const [data, setData] = useState<GroupData | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("list");
  const [entry, setEntry] = useState<"join" | "login">("join");
  const [selected, setSelected] = useState<PublicParticipant | null>(null);
  const [reveal, setReveal] = useState<{ taps: number; opened: boolean; done: boolean } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const revs = useRef({ rev: -1, chatRev: -1 });

  /** Pergunta ao servidor se algo mudou; só baixa o grupo (com as fotos) e o "meu" quando precisa. */
  const load = useCallback(
    async (force = false) => {
      try {
        const d = await api<Poll>(`/api/groups/${gid}${force ? "" : `?rev=${revs.current.rev}`}`);
        const groupChanged = !d.unchanged;
        const chatChanged = d.chatRev !== revs.current.chatRev;
        if (groupChanged && d.group && d.participants) setData({ group: d.group, participants: d.participants });
        revs.current = { rev: d.rev, chatRev: d.chatRev };
        if (session.get(gid) && (force || groupChanged || chatChanged)) {
          try {
            setMe(await api<MeResponse>(`/api/groups/${gid}/me`, { gid }));
          } catch (e) {
            if ((e as { status?: number }).status === 401) {
              session.clear(gid);
              setMe(null);
            }
          }
        }
      } catch (e) {
        if ((e as { status?: number }).status === 404) setNotFound(true);
      }
    },
    [gid],
  );

  useEffect(() => {
    load(true);
    setIsAdmin(!!adminKey.get(gid));
  }, [load, gid]);
  usePolling(() => load(), 8000);

  const groupName = data?.group.name;
  useEffect(() => {
    if (groupName) recentGroups.add(gid, groupName);
  }, [gid, groupName]);

  const hasMatch = !!me?.match;
  useEffect(() => {
    if (hasMatch) setTab((t) => (t === "list" ? "match" : t));
  }, [hasMatch]);

  const err = (m: string) => setToast(m);
  const reload = () => load(true);

  async function updateMe(body: Record<string, unknown>) {
    try {
      await api(`/api/groups/${gid}/me`, { gid, method: "PUT", body });
      await reload();
    } catch (e) {
      err((e as Error).message);
      throw e;
    }
  }

  async function startReveal() {
    try {
      await api(`/api/groups/${gid}/me`, { gid, method: "PUT", body: { reveal: true } });
      setMe(await api<MeResponse>(`/api/groups/${gid}/me`, { gid }));
      setReveal({ taps: 0, opened: false, done: false });
    } catch (e) {
      err((e as Error).message);
    }
  }

  function tapGift() {
    setReveal((r) => {
      if (!r || r.opened) return r;
      const taps = r.taps + 1;
      if (taps >= 3) {
        setTimeout(() => boom("big"), 500);
        setTimeout(() => setReveal((x) => (x ? { ...x, done: true } : x)), 1900);
        navigator.vibrate?.([60, 40, 120]);
        return { taps, opened: true, done: false };
      }
      navigator.vibrate?.(40);
      return { ...r, taps };
    });
  }

  async function share() {
    const url = `${location.origin}/g/${gid}`;
    const text = `Amigo secreto "${data?.group.name}". Entra aqui e monta seu boneco:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Amigo secreto", text, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setToast("Link copiado. Agora é só colar no grupo.");
  }

  if (notFound)
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="space-y-4">
          <h1 className="font-display text-3xl font-semibold">Esse grupo não existe</h1>
          <p className="text-muted">Confira se o link está certo.</p>
          <Link href="/">
            <Button>Voltar ao início</Button>
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
  const mine = me?.me;
  const revealed = !!mine?.revealedAt;

  const tabs: [Tab, string][] = [
    ...(drawn && revealed ? ([["match", "Quem eu tirei"]] as [Tab, string][]) : []),
    ["list", "Minha lista"],
    ["char", "Meu boneco"],
    ...(drawn ? ([["santa", "Quem me tirou"]] as [Tab, string][]) : []),
  ];

  const info = [budgetLabel(group.budgetMin, group.budgetMax), group.eventDate && dateLabel(group.eventDate), group.eventPlace].filter(Boolean);

  return (
    <main className="relative pb-20">
      <SnowCSS count={15} />
      <header className="relative z-10 mx-auto max-w-6xl px-5 pt-6">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex gap-2">
            {isAdmin && (
              <Link href={`/g/${gid}/admin`}>
                <Button variant="ghost" className="px-3 py-2 text-sm">
                  Organizar
                </Button>
              </Link>
            )}
            {!drawn && (
              <Button variant="gold" className="px-3 py-2 text-sm" onClick={share}>
                Convidar
              </Button>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{group.name}</h1>
            <p className="mt-1 text-muted">{info.join("  ·  ")}</p>
            {group.description && <p className="mt-2 max-w-xl text-cream/80">{group.description}</p>}
          </div>
          <Countdown to={group.eventDate} />
        </div>
      </header>

      <section className="relative mx-auto mt-6 max-w-6xl px-3 sm:px-5">
        <div className="relative h-[50vh] min-h-[340px] overflow-hidden rounded-[22px] border border-line">
          <Lobby3D people={participants} mode={drawn ? "party" : "idle"} highlightId={mine?.id} onSelect={setSelected} className="h-full w-full" theme={group.theme} />
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-ink/70 px-3 py-1.5 text-sm font-semibold backdrop-blur">
            {participants.length} {participants.length === 1 ? "pessoa" : "pessoas"}
            <span className="text-muted">{drawn ? "  ·  sorteio feito" : "  ·  esperando o sorteio"}</span>
          </div>
          {participants.length === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-lg bg-ink/70 px-4 py-2 font-semibold">Ninguém entrou ainda. Seja o primeiro.</p>
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-6 max-w-6xl space-y-5 px-5">
        {!mine ? (
          <>
            {!drawn && (
              <div className="flex justify-center">
                <Tabs
                  id="entry"
                  value={entry}
                  onChange={setEntry}
                  items={[
                    ["join", "Quero entrar"],
                    ["login", "Já entrei"],
                  ]}
                />
              </div>
            )}
            {entry === "join" && !drawn ? (
              <JoinFlow gid={gid} onJoined={reload} onError={err} theme={group.theme} />
            ) : (
              <div className="mx-auto max-w-xl">
                <LoginFlow gid={gid} people={participants} onJoined={reload} onError={err} />
              </div>
            )}
          </>
        ) : (
          <>
            {drawn && !revealed && (
              <div className="py-2 text-center">
                <motion.button
                  onClick={startReveal}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="btn btn-gold px-8 py-5 font-display text-2xl"
                >
                  Descobrir meu amigo secreto
                </motion.button>
                <p className="mt-3 text-sm text-muted">Veja quem você tirou.</p>
              </div>
            )}
            {!drawn && (
              <Card className="flex flex-wrap items-center gap-4">
                <Avatar photo={mine.photo} name={mine.name} color={mine.color} size={52} />
                <div className="flex-1">
                  <p className="font-display text-xl font-semibold">Oi, {mine.name}. Você está no grupo.</p>
                  <p className="text-sm text-muted">Enquanto o sorteio não sai, preencha sua lista para facilitar a vida de quem te tirar.</p>
                </div>
              </Card>
            )}

            <Tabs id="tab" value={tab} onChange={setTab} items={tabs} />

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                {tab === "match" && me?.match && (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <Card>
                      <div className="mb-4 flex items-center gap-4">
                        <Avatar photo={me.match.photo} name={me.match.name} color={me.match.color} size={68} />
                        <div>
                          <p className="text-sm text-muted">Você tirou</p>
                          <h2 className="font-display text-3xl font-semibold">{me.match.name}</h2>
                        </div>
                      </div>
                      <ProfileExtras p={me.match} />
                      <h3 className="mb-2 mt-5 font-bold">Lista de presentes</h3>
                      <WishlistView items={me.match.wishlist} group={group} />
                    </Card>
                    <Card delay={0.08}>
                      <h3 className="font-bold">Conversar com {me.match.name}</h3>
                      <p className="mb-3 text-sm text-muted">Do outro lado aparece só “Papai Noel”. Pergunte o que precisar.</p>
                      <Chat
                        messages={me.chatWithGiftee}
                        me="santa"
                        otherLabel={me.match.name}
                        placeholder="Qual o número do seu calçado?"
                        onSend={async (text) => {
                          await api(`/api/groups/${gid}/messages`, { gid, body: { to: "giftee", text } }).catch((e) => err(e.message));
                          await reload();
                        }}
                      />
                    </Card>
                  </div>
                )}
                {tab === "list" && (
                  <Card>
                    <h2 className="font-display text-2xl font-semibold">Minha lista</h2>
                    <p className="mb-4 text-sm text-muted">Quem te tirar vê essa lista.</p>
                    <WishlistEditor items={mine.wishlist} group={group} onChange={(wishlist) => updateMe({ wishlist })} />
                  </Card>
                )}
                {tab === "char" && <CharacterEditor me={mine} onSave={updateMe} />}
                {tab === "santa" && (
                  <Card>
                    <h2 className="font-display text-2xl font-semibold">Quem me tirou</h2>
                    <p className="mb-3 text-sm text-muted">Você não sabe quem é, e a pessoa não vai contar. Mas dá pra conversar e soltar umas dicas.</p>
                    <Chat
                      messages={me?.chatWithSanta ?? []}
                      me="giftee"
                      otherLabel="Papai Noel"
                      placeholder="Uma dica: eu adoro café"
                      onSend={async (text) => {
                        await api(`/api/groups/${gid}/messages`, { gid, body: { to: "santa", text } }).catch((e) => err(e.message));
                        await reload();
                      }}
                    />
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="pt-4 text-center">
              <button
                className="text-xs text-muted underline-offset-2 hover:underline"
                onClick={() => {
                  session.clear(gid);
                  setMe(null);
                }}
              >
                Sair neste aparelho
              </button>
            </div>
          </>
        )}
      </section>

      {/* perfil ao clicar num boneco */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-40 grid place-items-end bg-black/60 p-3 sm:place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="panel max-h-[80vh] w-full max-w-md overflow-y-auto p-6"
            >
              <div className="mb-4 flex items-center gap-4">
                <Avatar photo={selected.photo} name={selected.name} color={selected.color} size={60} />
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-semibold">{selected.name}</h3>
                  <p className="text-sm text-muted">
                    {selected.wishlist.length} {selected.wishlist.length === 1 ? "item" : "itens"} na lista
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-2xl leading-none text-muted hover:text-cream" aria-label="Fechar">
                  ×
                </button>
              </div>
              <ProfileExtras p={selected} />
              <div className="mt-3">
                <WishlistView items={selected.wishlist} group={group} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* revelação */}
      <AnimatePresence>
        {reveal && me?.match && (
          <motion.div className="fixed inset-0 z-50 bg-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Reveal3D person={me.match} taps={reveal.taps} opened={reveal.opened} onTap={tapGift} className="absolute inset-0" theme={group.theme} />
            <div className="pointer-events-none absolute inset-x-0 top-10 px-4 text-center">
              <AnimatePresence mode="wait">
                {!reveal.opened ? (
                  <motion.p
                    key={reveal.taps}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="font-display text-3xl font-semibold sm:text-4xl"
                  >
                    {TAP_TEXT[reveal.taps]}
                  </motion.p>
                ) : (
                  reveal.done && (
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }}>
                      <p className="text-lg text-muted">Você tirou</p>
                      <p className="font-display text-6xl font-semibold text-gold sm:text-7xl">{me.match.name}</p>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
            {reveal.done && (
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="absolute inset-x-0 bottom-10 flex justify-center">
                <Button
                  variant="gold"
                  className="px-8 py-4 text-lg"
                  onClick={() => {
                    setReveal(null);
                    setTab("match");
                  }}
                >
                  Ver a lista de presentes
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}

function ProfileExtras({ p }: { p: PublicParticipant }) {
  const rows = [
    ["Gosta de", p.likes],
    ["Não curte", p.dislikes],
    ["Tamanhos", p.sizes],
  ].filter(([, v]) => v);
  if (!rows.length) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl border border-line bg-ink p-3 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function CharacterEditor({ me, onSave }: { me: PublicParticipant; onSave: (b: Record<string, unknown>) => Promise<void> }) {
  const [f, setF] = useState({ photo: me.photo, color: me.color, likes: me.likes ?? "", dislikes: me.dislikes ?? "", sizes: me.sizes ?? "" });
  const [saving, setSaving] = useState(false);
  return (
    <Card>
      <h2 className="mb-4 font-display text-2xl font-semibold">Meu boneco</h2>
      <div className="space-y-5">
        <PhotoPicker value={f.photo} color={f.color} onChange={(photo) => setF({ ...f, photo })} />
        <Field label="Cor da roupa">
          <ColorPicker value={f.color} onChange={(color) => setF({ ...f, color })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Do que você gosta">
            <input className="input" placeholder="Café, livros, futebol" value={f.likes} onChange={(e) => setF({ ...f, likes: e.target.value })} />
          </Field>
          <Field label="O que não curte">
            <input className="input" placeholder="Perfume doce" value={f.dislikes} onChange={(e) => setF({ ...f, dislikes: e.target.value })} />
          </Field>
          <Field label="Tamanhos">
            <input className="input" placeholder="Camisa M, calçado 40" value={f.sizes} onChange={(e) => setF({ ...f, sizes: e.target.value })} />
          </Field>
        </div>
        <Button
          variant="gold"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({ ...f, photo: f.photo ?? null });
              boom("small");
            } catch {
            } finally {
              setSaving(false);
            }
          }}
        >
          Salvar
        </Button>
      </div>
    </Card>
  );
}
