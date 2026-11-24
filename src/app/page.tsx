"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button, Lobby3D, Logo, SnowCSS } from "@/components/ui";
import type { PublicParticipant } from "@/lib/types";

const demo: PublicParticipant[] = [
  ["Ana", "#d94a3d"], ["Bruno", "#2563eb"], ["Carla", "#3e8e5e"], ["Diego", "#f0b54a"],
  ["Eva", "#9333ea"], ["Fábio", "#0891b2"], ["Gabi", "#db2777"],
].map(([name, color], i) => ({ id: String(i), name, color, emoji: "", wishlist: [], joinedAt: i }));

const steps = [
  ["Crie o grupo", "Dê um nome, defina o valor do presente e a data da troca."],
  ["Mande o link", "Cada um entra pelo celular, coloca uma foto e vira um bonequinho."],
  ["Façam a lista", "Todo mundo anota o que quer ganhar, com preço e link da loja."],
  ["Sorteie", "Só você aperta o botão, mas nem você fica sabendo quem tirou quem."],
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <SnowCSS count={25} />
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 pt-6">
        <Logo />
        <div className="flex items-center gap-5">
          <Link href="/criar" className="text-sm font-semibold text-muted hover:text-cream">
            Criar grupo
          </Link>
          <Link href="/entrar" className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-cream hover:border-gold">
            Entrar
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 sm:pt-16 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl"
            style={{ fontVariationSettings: '"SOFT" 100' }}
          >
            O amigo secreto da turma, com <em className="text-berry">bonequinho</em> e tudo.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-5 max-w-md text-lg leading-relaxed text-muted"
          >
            Cada pessoa sobe uma foto e ganha um boneco de gorro. Vocês montam a lista de presentes, o sorteio acontece online e cada um descobre o próprio amigo secreto direto na tela.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/criar">
              <Button variant="red" className="px-7 py-3.5 text-lg">
                Criar um grupo
              </Button>
            </Link>
            <Link href="/entrar">
              <Button variant="ghost" className="px-6 py-3.5 text-lg">
                Já estou num grupo
              </Button>
            </Link>
            <Link href="/demo" className="text-sm font-semibold text-muted underline-offset-4 hover:text-cream hover:underline">
              Ver uma demonstração
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative h-[400px] overflow-hidden rounded-[22px] border border-line sm:h-[500px]">
            <Lobby3D people={demo} className="h-full w-full" />
          </div>
          <p className="mt-2 text-right text-xs text-muted">Arraste para girar. Clique num boneco.</p>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 py-24">
        <h2 className="font-display text-3xl font-semibold">Como funciona</h2>
        <ol className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, text], i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border-t-2 border-line pt-4"
            >
              <span className="font-display text-4xl font-semibold text-gold">{i + 1}</span>
              <h3 className="mt-2 text-lg font-bold">{title}</h3>
              <p className="mt-1 text-muted">{text}</p>
            </motion.li>
          ))}
        </ol>

        <div className="mt-16 grid gap-8 rounded-[22px] border border-line bg-ink-2 p-8 sm:grid-cols-3">
          <div>
            <h3 className="font-bold">Chat anônimo</h3>
            <p className="mt-1 text-sm text-muted">Pergunte o tamanho da camisa sem se entregar. A outra pessoa só vê “Papai Noel”.</p>
          </div>
          <div>
            <h3 className="font-bold">Quem não pode tirar quem</h3>
            <p className="mt-1 text-sm text-muted">Casal, irmãos ou quem já se tirou ano passado: é só marcar antes de sortear.</p>
          </div>
          <div>
            <h3 className="font-bold">Valor combinado</h3>
            <p className="mt-1 text-sm text-muted">Cada presente da lista mostra se está dentro da faixa de preço do grupo.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">Feliz Natal.</footer>
    </main>
  );
}
