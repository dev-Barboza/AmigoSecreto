/**
 * Sorteio: tenta formar UM ciclo único (A→B→C→…→A), que deixa a revelação
 * no dia da festa em corrente. Se as restrições impedirem, cai para qualquer
 * permutação válida (ninguém tira a si mesmo nem alguém proibido).
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(randomFloat() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomFloat() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

export function drawPairs(ids: string[], exclusions: [string, string][]): Record<string, string> | null {
  if (ids.length < 3) return null;
  const blocked = new Set<string>();
  for (const [a, b] of exclusions) {
    blocked.add(`${a}|${b}`);
    blocked.add(`${b}|${a}`);
  }
  const ok = (giver: string, receiver: string) => giver !== receiver && !blocked.has(`${giver}|${receiver}`);

  let budget = 300_000;

  // 1) ciclo único
  for (let attempt = 0; attempt < 20; attempt++) {
    const order = shuffle(ids);
    const path = [order[0]];
    const used = new Set(path);
    const dfs = (): boolean => {
      if (--budget < 0) return false;
      if (path.length === ids.length) return ok(path[path.length - 1], path[0]);
      const last = path[path.length - 1];
      for (const next of shuffle(ids)) {
        if (used.has(next) || !ok(last, next)) continue;
        path.push(next);
        used.add(next);
        if (dfs()) return true;
        path.pop();
        used.delete(next);
      }
      return false;
    };
    if (dfs()) {
      const res: Record<string, string> = {};
      path.forEach((id, i) => (res[id] = path[(i + 1) % path.length]));
      return res;
    }
    if (budget < 0) break;
  }

  // 2) qualquer permutação válida
  budget = 300_000;
  const givers = shuffle(ids);
  const res: Record<string, string> = {};
  const taken = new Set<string>();
  const assign = (i: number): boolean => {
    if (--budget < 0) return false;
    if (i === givers.length) return true;
    for (const r of shuffle(ids)) {
      if (taken.has(r) || !ok(givers[i], r)) continue;
      res[givers[i]] = r;
      taken.add(r);
      if (assign(i + 1)) return true;
      taken.delete(r);
    }
    return false;
  };
  return assign(0) ? res : null;
}
