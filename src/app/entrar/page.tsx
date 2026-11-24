"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NamePasswordForm } from "@/components/group/Join";
import { Button, Card, Field, Logo, SnowCSS, Toast } from "@/components/ui";
import { adminKey, api, groupIdFrom, recentGroups, session, type RecentGroup } from "@/lib/client";

type Match = { gid: string; groupName: string; participantId: string; token: string };

/** Entrar só com nome + senha: o servidor descobre em qual grupo a pessoa está. */
export default function Entrar() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [choices, setChoices] = useState<Match[] | null>(null);
  const [recent, setRecent] = useState<RecentGroup[]>([]);
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  useEffect(() => setRecent(recentGroups.list()), []);

  async function login(name: string, password: string) {
    try {
      const { matches } = await api<{ matches: Match[] }>("/api/login", { body: { name, password } });
      for (const m of matches) {
        session.set(m.gid, { participantId: m.participantId, token: m.token });
        recentGroups.add(m.gid, m.groupName);
      }
      if (matches.length === 1) router.push(`/g/${matches[0].gid}`);
      else setChoices(matches);
    } catch (e) {
      setToast((e as Error).message);
    }
  }

  function goCode(e: React.FormEvent) {
    e.preventDefault();
    const id = groupIdFrom(code);
    if (!id) return setToast("Cole o link que te mandaram ou só o código do grupo.");
    router.push(`/g/${id}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <SnowCSS count={18} />
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
        <Logo />
        <Link href="/criar" className="text-sm font-semibold text-muted hover:text-cream">
          Criar grupo
        </Link>
      </nav>

      <section className="relative z-10 mx-auto max-w-lg space-y-5 px-5 pt-14 pb-20">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-2 text-muted">Digite o nome e a senha que você usou no seu grupo. A gente acha a sua sala.</p>
        </div>

        {choices ? (
          <Card>
            <h2 className="mb-3 font-bold">Você está em mais de um grupo. Qual quer abrir?</h2>
            <ul className="space-y-2">
              {choices.map((m) => (
                <li key={m.gid}>
                  <Link href={`/g/${m.gid}`} className="flex items-center justify-between rounded-xl border border-line bg-ink px-4 py-3 hover:border-gold">
                    <span className="font-semibold">{m.groupName}</span>
                    <span className="text-sm text-muted">Abrir →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <NamePasswordForm onSubmit={login} />
          </Card>
        )}

        {recent.length > 0 && (
          <Card delay={0.05}>
            <h2 className="mb-3 font-bold">Abertos neste aparelho</h2>
            <ul className="space-y-2">
              {recent.map((g) => (
                <li key={g.id}>
                  <Link
                    href={adminKey.get(g.id) ? `/g/${g.id}/admin` : `/g/${g.id}`}
                    className="flex items-center justify-between rounded-xl border border-line bg-ink px-4 py-3 hover:border-gold"
                  >
                    <span className="font-semibold">{g.name}</span>
                    <span className="text-sm text-muted">{adminKey.get(g.id) ? "Organizador →" : "Abrir →"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="text-center">
          {showCode ? (
            <Card className="text-left">
              <form onSubmit={goCode} className="space-y-4">
                <Field label="Link ou código do grupo" hint="Para quem ainda não entrou: abra o grupo e monte o seu boneco.">
                  <input className="input w-full" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Cole aqui" autoFocus />
                </Field>
                <Button type="submit" variant="ghost" className="w-full" disabled={!code.trim()}>
                  Ir para o grupo
                </Button>
              </form>
            </Card>
          ) : (
            <button onClick={() => setShowCode(true)} className="text-sm font-semibold text-muted underline-offset-4 hover:text-cream hover:underline">
              Ainda não entrou? Use o link do grupo
            </button>
          )}
        </div>
      </section>
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
