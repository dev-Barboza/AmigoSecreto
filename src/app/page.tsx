"use client";

import Link from "next/link";
import { Button, Lobby3D, Logo } from "@/components/ui";
import type { PublicParticipant } from "@/lib/types";

const demo: PublicParticipant[] = [
  ["Ana", "#d94a3d"], ["Bruno", "#2563eb"], ["Carla", "#3e8e5e"], ["Diego", "#f0b54a"],
  ["Eva", "#9333ea"], ["Fábio", "#0891b2"], ["Gabi", "#db2777"],
].map(([name, color], i) => ({ id: String(i), name, color, emoji: "", wishlist: [], joinedAt: i }));

const faq: [string, string][] = [
  ["Quem organiza consegue ver quem tirou quem?", "Não. O resultado de cada pessoa é criptografado com a senha dela, e a lista aberta de quem tirou quem não fica salva em lugar nenhum. Nem quem organiza, nem quem tem acesso ao banco de dados consegue ler."],
  ["Precisa baixar alguma coisa?", "Não. É um link: abre no navegador do celular, a pessoa coloca o nome, uma foto se quiser, e uma senha."],
  ["E se alguém esquecer a senha?", "Quem organiza cria uma senha nova pela página de organizador. Antes do sorteio, é só isso. Depois do sorteio, o resultado dessa pessoa estava trancado com a senha antiga, então é preciso refazer o sorteio."],
  ["Dá para impedir que casal se tire?", "Dá. Antes do sorteio, quem organiza marca os pares que não podem sair."],
  ["Já tenho uma lista na Amazon. Preciso refazer?", "Não. Na sua lista, cola o link da lista que você já tem e pronto. Quem te tirar abre direto."],
];

export default function Home() {
  return (
    <main>
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-6">
        <Logo />
        <div className="flex items-center gap-5 text-sm font-semibold">
          <Link href="/criar" className="text-muted hover:text-cream">
            Criar grupo
          </Link>
          <Link href="/entrar" className="text-cream underline decoration-line decoration-2 underline-offset-4 hover:decoration-gold">
            Entrar
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pt-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Amigo secreto sem papelzinho.</h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            Manda um link no grupo, cada um entra com o nome e uma foto, monta a lista do que quer ganhar e o sorteio sai aqui. Ninguém precisa baixar nada.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/criar">
              <Button variant="red" className="px-6 py-3 text-base">
                Criar um grupo
              </Button>
            </Link>
            <Link href="/entrar">
              <Button variant="ghost" className="px-6 py-3 text-base">
                Já estou num grupo
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            Quer ver antes?{" "}
            <Link href="/demo" className="text-cream underline underline-offset-4 hover:text-gold">
              Tem um grupo de teste aqui
            </Link>
            .
          </p>
        </div>

        <div>
          <div className="relative h-[360px] overflow-hidden rounded-2xl border border-line sm:h-[460px]">
            <Lobby3D people={demo} className="h-full w-full" />
          </div>
          <p className="mt-2 text-xs text-muted">Dá para girar com o dedo. Tem também a versão tribunal, com os bonecos de toga.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold">Perguntas que sempre aparecem</h2>
            <p className="mt-2 text-muted">Se a sua não está aqui, pergunta para quem te mandou o link.</p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {faq.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span className="text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl border-t border-line px-5 py-6 text-sm text-muted">
        Feito para o amigo secreto da turma. Sem anúncio e sem cadastro com e-mail.
      </footer>
    </main>
  );
}
