"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Field, Logo, SnowCSS } from "@/components/ui";
import { adminKey, groupIdFrom, recentGroups, type RecentGroup } from "@/lib/client";

/** Volta para um grupo que já existe: pelo link/código ou pela lista de grupos deste aparelho. */
export default function Entrar() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentGroup[]>([]);

  useEffect(() => setRecent(recentGroups.list()), []);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const id = groupIdFrom(code);
    if (!id) return setError("Cole o link que te mandaram ou só o código do grupo.");
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
          <h1 className="font-display text-4xl font-semibold tracking-tight">Entrar no meu grupo</h1>
          <p className="mt-2 text-muted">
            Abra o grupo, toque em <strong className="text-cream">Já entrei</strong>, escolha o seu boneco e digite o seu PIN.
          </p>
        </div>

        {recent.length > 0 && (
          <Card>
            <h2 className="mb-3 font-bold">Seus grupos neste aparelho</h2>
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

        <Card delay={0.05}>
          <form onSubmit={go} className="space-y-4">
            <Field label="Link ou código do grupo" hint="Ex.: amigo-secreto.vercel.app/g/abcd1234 ou só abcd1234">
              <input
                className="input w-full"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="Cole aqui"
                autoFocus={recent.length === 0}
              />
            </Field>
            {error && <p className="text-sm text-berry">{error}</p>}
            <Button type="submit" className="w-full" disabled={!code.trim()}>
              Ir para o grupo
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted">
          Não achou o link? Peça de novo para quem organizou.
        </p>
      </section>
    </main>
  );
}
