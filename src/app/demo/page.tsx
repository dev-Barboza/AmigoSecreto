"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { Chat } from "@/components/group/Chat";
import { ColorPicker, PhotoPicker } from "@/components/group/Join";
import { WishlistEditor, WishlistView } from "@/components/group/Wishlist";
import { ThemePicker } from "@/components/group/ThemePicker";
import { Avatar, boom, Button, Card, Field, Lobby3D, Logo, Reveal3D, Tabs } from "@/components/ui";
import type { Theme } from "@/lib/theme";
import type { LobbyMode } from "@/components/three/Lobby";
import { budgetLabel, BODY_COLORS } from "@/lib/format";
import type { ChatMessage, PublicGroup, PublicParticipant, WishItem } from "@/lib/types";

/** Página de demonstração: tudo roda no navegador, sem banco. Nada é salvo. */

const GROUP: PublicGroup = { id: "demo", name: "Demonstração", organizerName: "", createdAt: 0, exclusions: [], budgetMin: 30, budgetMax: 150 };

const search = (q: string) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;
let seq = 0;
const item = (title: string, price: number, priority: 1 | 2 | 3, note?: string): WishItem => ({
  id: `w${seq++}`,
  title,
  price,
  priority,
  note,
  link: search(title),
});

type Sample = { name: string; color: string; likes: string; dislikes: string; sizes: string; wishlist: WishItem[] };
const SAMPLES: Sample[] = [
  {
    name: "Ana",
    color: "#d94a3d",
    likes: "Café, livros de suspense, plantas",
    dislikes: "Perfume doce",
    sizes: "Camisa P, calçado 36",
    wishlist: [
      item("Kit café especial", 65, 3, "Grão moído, torra média"),
      item("Livro de suspense", 45, 2, "Qualquer um da Freida McFadden"),
      item("Vaso com suculenta", 40, 1),
    ],
  },
  {
    name: "Bruno",
    color: "#2563eb",
    likes: "Futebol, churrasco, videogame",
    dislikes: "Roupa social",
    sizes: "Camisa G, calçado 42",
    wishlist: [
      item("Camisa de time", 140, 3, "Tamanho G, pode ser retrô"),
      item("Kit churrasco", 90, 2, "Faca e garfo trinchante"),
      item("Meias divertidas", 40, 1),
    ],
  },
  {
    name: "Carla",
    color: "#16a34a",
    likes: "Skincare, séries, gatos",
    dislikes: "Coisa de cozinha",
    sizes: "Camisa M, calçado 38",
    wishlist: [
      item("Kit skincare", 100, 3, "Pele oleosa"),
      item("Pantufa de gatinho", 60, 2, "Tamanho 37/38"),
      item("Caneca personalizada", 35, 1),
    ],
  },
  {
    name: "Diego",
    color: "#f59e0b",
    likes: "Música, bicicleta, cerveja artesanal",
    dislikes: "Chocolate branco",
    sizes: "Camisa G, calçado 41",
    wishlist: [
      item("Caixa de som bluetooth", 149, 3, "À prova d'água"),
      item("Garrafa térmica", 80, 2, "Preta, 1 litro"),
      item("Kit cervejas artesanais", 70, 2),
    ],
  },
  {
    name: "Eva",
    color: "#9333ea",
    likes: "Desenho, chocolate, viagem",
    dislikes: "Bijuteria",
    sizes: "Camisa P, calçado 35",
    wishlist: [
      item("Kit de canetas brush", 89, 3, "Tons pastel"),
      item("Chocolates artesanais", 50, 2),
      item("Necessaire de viagem", 55, 1),
      item("Fone com cancelamento de ruído", 299, 1, "Sei que passa do valor, é só um sonho"),
    ],
  },
];

const REPLIES = [
  "Haha, quem é você?",
  "Qualquer coisa da minha lista eu vou amar.",
  "Meu tamanho tá no perfil, dá uma olhada.",
  "Prefiro cores escuras, se puder escolher.",
  "Não conta pra ninguém, mas o primeiro da lista é o que eu mais quero.",
];

const ME_ID = "me";
const fromSample = (s: Sample, i: number): PublicParticipant => ({ id: `p${i}`, emoji: "", joinedAt: i, ...s });

type Tab = "match" | "list" | "char" | "people";
const TAP_TEXT = ["Toque para descobrir", "De novo", "Quase lá..."];

export default function Demo() {
  const [others, setOthers] = useState(() => SAMPLES.map(fromSample));
  const [me, setMe] = useState<PublicParticipant>({ id: ME_ID, name: "Você", color: "#0891b2", emoji: "", wishlist: [], joinedAt: 99 });
  const [mode, setMode] = useState<LobbyMode>("idle");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reveal, setReveal] = useState<{ taps: number; opened: boolean; done: boolean } | null>(null);
  const [round, setRound] = useState(0);
  const [theme, setTheme] = useState<Theme>("natal");
  const [tab, setTab] = useState<Tab>("char");
  const [selected, setSelected] = useState<PublicParticipant | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const replyIdx = useRef(0);

  // formulário "adicionar pessoa"
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [color, setColor] = useState(BODY_COLORS[3]);

  const people = [...others, me];
  const match = others.find((p) => p.id === matchId) ?? null;

  function draw() {
    setMode("shuffle");
    setRevealed(false);
    setChat([]);
    replyIdx.current = 0;
    setTimeout(() => {
      setMode("party");
      boom("big");
      setMatchId(others[Math.floor(Math.random() * others.length)].id);
    }, 4200);
  }

  function openGift() {
    setRound((r) => r + 1);
    setReveal({ taps: 0, opened: false, done: false });
  }

  function tap() {
    setReveal((r) => {
      if (!r || r.opened) return r;
      const taps = r.taps + 1;
      if (taps >= 3) {
        setTimeout(() => boom("big"), 500);
        setTimeout(() => setReveal((x) => (x ? { ...x, done: true } : x)), 1900);
        return { taps, opened: true, done: false };
      }
      return { ...r, taps };
    });
  }

  function seeList() {
    setReveal(null);
    setRevealed(true);
    setTab("match");
  }

  function reset() {
    setReveal(null);
    setMatchId(null);
    setRevealed(false);
    setMode("idle");
    if (tab === "match") setTab("list");
  }

  async function send(text: string) {
    setChat((c) => [...c, { from: "santa", text, at: Date.now() }]);
    const reply = REPLIES[replyIdx.current++ % REPLIES.length];
    setTimeout(() => setChat((c) => [...c, { from: "giftee", text: reply, at: Date.now() }]), 1200);
  }

  function add() {
    if (!name.trim()) return;
    setOthers((p) => [...p, { id: `x${Date.now()}`, name: name.trim(), color, photo, emoji: "", wishlist: [], joinedAt: Date.now() }]);
    setName("");
    setPhoto(undefined);
    setColor(BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)]);
  }

  const tabs: [Tab, string][] = [
    ...(revealed && match ? ([["match", "Quem eu tirei"]] as [Tab, string][]) : []),
    ["char", "Meu boneco"],
    ["list", "Minha lista"],
    ["people", "Pessoas"],
  ];

  return (
    <main className="pb-20">
      <header className="mx-auto max-w-6xl px-5 pt-6">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="rounded-lg border border-line px-3 py-1 text-sm text-muted">demonstração</span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">Grupo de teste</h1>
        <p className="mt-1 text-muted">{budgetLabel(GROUP.budgetMin, GROUP.budgetMax)}  ·  nada aqui é salvo</p>
        <div className="mt-4 max-w-sm">
          <ThemePicker compact value={theme} onChange={setTheme} />
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-6xl px-3 sm:px-5">
        <div className="relative h-[52vh] min-h-[360px] overflow-hidden rounded-[22px] border border-line">
          <Lobby3D people={people} mode={mode} highlightId={ME_ID} onSelect={setSelected} className="h-full w-full" theme={theme} />
          <AnimatePresence>
            {mode === "shuffle" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, scale: [1, 1.08, 1] }}
                exit={{ opacity: 0 }}
                transition={{ scale: { repeat: Infinity, duration: 0.5 } }}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-ink/80 px-6 py-3 font-display text-4xl font-semibold"
              >
                Sorteando...
              </motion.p>
            )}
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-5 flex justify-center gap-3">
            {mode === "idle" && (
              <Button variant="gold" className="px-8 py-4 text-xl" onClick={draw}>
                Sortear
              </Button>
            )}
            {mode === "party" && matchId && (
              <>
                <Button variant="gold" className="px-8 py-4 text-xl" onClick={openGift}>
                  {revealed ? "Ver de novo" : "Descobrir meu amigo secreto"}
                </Button>
                <Button variant="ghost" className="py-4" onClick={reset}>
                  Recomeçar
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="mt-2 text-right text-xs text-muted">Clique num boneco para ver o perfil e a lista dele.</p>
      </section>

      <section className="mx-auto mt-4 max-w-6xl space-y-5 px-5">
        <Tabs id="demotab" value={tab} onChange={setTab} items={tabs} />

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {tab === "match" && match && (
              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <div className="mb-4 flex items-center gap-4">
                    <Avatar photo={match.photo} name={match.name} color={match.color} size={68} />
                    <div>
                      <p className="text-sm text-muted">Você tirou</p>
                      <h2 className="font-display text-3xl font-semibold">{match.name}</h2>
                    </div>
                  </div>
                  <ProfileExtras p={match} />
                  <h3 className="mb-2 mt-5 font-bold">Lista de presentes</h3>
                  <WishlistView items={match.wishlist} group={GROUP} />
                </Card>
                <Card delay={0.08}>
                  <h3 className="font-bold">Conversar com {match.name}</h3>
                  <p className="mb-3 text-sm text-muted">Do outro lado aparece só “Papai Noel”. Na demonstração, a pessoa responde sozinha.</p>
                  <Chat messages={chat} me="santa" otherLabel={match.name} placeholder="Qual o número do seu calçado?" onSend={send} />
                </Card>
              </div>
            )}

            {tab === "char" && (
              <Card>
                <h2 className="mb-4 font-display text-2xl font-semibold">Meu boneco</h2>
                <div className="space-y-5">
                  <Field label="Seu nome">
                    <input className="input" maxLength={40} value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value || "Você" })} />
                  </Field>
                  <PhotoPicker value={me.photo} color={me.color} onChange={(photo) => setMe({ ...me, photo })} />
                  <Field label="Cor da roupa">
                    <ColorPicker value={me.color} onChange={(c) => setMe({ ...me, color: c })} />
                  </Field>
                  <p className="text-sm text-muted">As mudanças aparecem na hora no boneco do lobby (o que está acenando).</p>
                </div>
              </Card>
            )}

            {tab === "list" && (
              <Card>
                <h2 className="font-display text-2xl font-semibold">Minha lista</h2>
                <p className="mb-4 text-sm text-muted">No app de verdade, quem te tirar vê essa lista.</p>
                <WishlistEditor items={me.wishlist} group={GROUP} onChange={async (wishlist) => setMe((m) => ({ ...m, wishlist }))} />
              </Card>
            )}

            {tab === "people" && (
              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <h2 className="font-display text-xl font-semibold">Adicionar alguém</h2>
                  <p className="mb-4 text-sm text-muted">Pessoas novas entram sem lista de presentes.</p>
                  <div className="space-y-4">
                    <Field label="Nome">
                      <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
                    </Field>
                    <PhotoPicker value={photo} onChange={setPhoto} color={color} />
                    <ColorPicker value={color} onChange={setColor} />
                    <Button onClick={add} disabled={!name.trim() || mode !== "idle"}>
                      Adicionar
                    </Button>
                  </div>
                </Card>
                <Card delay={0.05}>
                  <h2 className="mb-3 font-display text-xl font-semibold">No grupo ({people.length})</h2>
                  <ul className="space-y-1">
                    {people.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-ink">
                        <Avatar photo={p.photo} name={p.name} color={p.color} size={34} />
                        <span className="flex-1">
                          {p.name}
                          {p.id === ME_ID && <span className="ml-2 text-xs text-muted">você</span>}
                        </span>
                        <span className="text-xs text-muted">{p.wishlist.length} na lista</span>
                        {mode === "idle" && p.id !== ME_ID && others.length > 2 && (
                          <button className="px-2 text-lg leading-none text-muted hover:text-berry" onClick={() => setOthers((x) => x.filter((y) => y.id !== p.id))}>
                            ×
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
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
                <h3 className="flex-1 font-display text-2xl font-semibold">{selected.name}</h3>
                <button onClick={() => setSelected(null)} className="text-2xl leading-none text-muted hover:text-cream" aria-label="Fechar">
                  ×
                </button>
              </div>
              <ProfileExtras p={selected} />
              <div className="mt-3">
                <WishlistView items={selected.wishlist} group={GROUP} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* revelação */}
      <AnimatePresence>
        {reveal && match && (
          <motion.div className="fixed inset-0 z-50 bg-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Reveal3D key={round} person={match} taps={reveal.taps} opened={reveal.opened} onTap={tap} className="absolute inset-0" theme={theme} />
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
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                      <p className="text-lg text-muted">Você tirou</p>
                      <p className="font-display text-6xl font-semibold text-gold sm:text-7xl">{match.name}</p>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
            {reveal.done && (
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="absolute inset-x-0 bottom-10 flex justify-center">
                <Button variant="gold" className="px-8 py-4 text-lg" onClick={seeList}>
                  Ver a lista de presentes
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
