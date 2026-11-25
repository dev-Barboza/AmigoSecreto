// Lista e apaga grupos do banco (Redis).
//
//   node --env-file=.env.local scripts/limpar-banco.mjs                 -> lista todos os grupos
//   node --env-file=.env.local scripts/limpar-banco.mjs apagar ID ID    -> apaga só esses
//   node --env-file=.env.local scripts/limpar-banco.mjs manter ID ID    -> apaga todos MENOS esses
//
// Sempre mostra o que vai apagar e pede para digitar "sim" antes.

import { createInterface } from "node:readline/promises";
import { createClient } from "redis";

const url = process.env.REDIS_URL || process.env.STORAGE_URL;
if (!url) {
  console.error("Falta a variável REDIS_URL. Crie o arquivo .env.local com REDIS_URL=redis://... (veja o passo a passo).");
  process.exit(1);
}

const db = createClient({ url });
db.on("error", (e) => console.error("Redis:", e.message));
await db.connect();

async function scan(pattern) {
  const keys = [];
  for await (const batch of db.scanIterator({ MATCH: pattern, COUNT: 500 })) keys.push(...(Array.isArray(batch) ? batch : [batch]));
  return keys;
}

// ---------- ler todos os grupos ----------
const groups = [];
for (const key of await scan("g:*:meta")) {
  const id = key.split(":")[1];
  const meta = JSON.parse((await db.get(key)) ?? "null");
  if (!meta) continue;
  const people = Object.values(await db.hGetAll(`g:${id}:p`)).map((v) => JSON.parse(v).name);
  groups.push({ id, name: meta.name, createdAt: meta.createdAt, drawn: !!meta.drawnAt, people });
}
groups.sort((a, b) => a.createdAt - b.createdAt);

const fmt = (g) =>
  `  ${g.id}  ${g.name.padEnd(24).slice(0, 24)}  ${new Date(g.createdAt).toLocaleString("pt-BR").padEnd(20)}  ` +
  `${String(g.people.length).padStart(2)} pessoa(s)${g.drawn ? "  · sorteado" : ""}\n            ${g.people.join(", ") || "(ninguém)"}`;

const [cmd, ...ids] = process.argv.slice(2);

if (!cmd) {
  console.log(`\n${groups.length} grupo(s) no banco:\n`);
  for (const g of groups) console.log(fmt(g) + "\n");
  console.log('Para apagar:  ... apagar ID ID   ou   ... manter ID   (apaga todos menos esse)\n');
  await db.quit();
  process.exit(0);
}

const known = new Set(groups.map((g) => g.id));
const unknown = ids.filter((id) => !known.has(id));
if (unknown.length) {
  console.error(`Não achei estes IDs: ${unknown.join(", ")}. Rode sem argumentos para ver a lista.`);
  await db.quit();
  process.exit(1);
}

let target;
if (cmd === "apagar") target = groups.filter((g) => ids.includes(g.id));
else if (cmd === "manter") target = groups.filter((g) => !ids.includes(g.id));
else {
  console.error('Comando desconhecido. Use "apagar" ou "manter".');
  await db.quit();
  process.exit(1);
}

if (!target.length) {
  console.log("Nada para apagar.");
  await db.quit();
  process.exit(0);
}

console.log(`\nVou APAGAR ${target.length} grupo(s):\n`);
for (const g of target) console.log(fmt(g) + "\n");
if (cmd === "manter") console.log(`E manter: ${groups.filter((g) => ids.includes(g.id)).map((g) => `${g.name} (${g.id})`).join(", ")}\n`);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ok = (await rl.question('Isso não tem volta. Digite "sim" para confirmar: ')).trim().toLowerCase() === "sim";
rl.close();
if (!ok) {
  console.log("Cancelado. Nada foi apagado.");
  await db.quit();
  process.exit(0);
}

// índice de nomes (n:<nome> -> { grupo: participante }) usado no login pela página inicial
const nameKeys = await scan("n:*");
for (const g of target) {
  const keys = await scan(`g:${g.id}:*`);
  if (keys.length) await db.del(keys);
  for (const nk of nameKeys) await db.hDel(nk, g.id);
  console.log(`  apagado: ${g.name} (${g.id}) — ${keys.length} chave(s)`);
}
console.log("\nPronto.");
await db.quit();
