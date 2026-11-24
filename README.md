# Amigo Secreto

Site de amigo secreto: cada pessoa vira um boneco 3D com a própria foto, monta a lista de presentes, e o sorteio e a revelação acontecem online.

Feito com Next.js, React Three Fiber e Redis (Upstash ou qualquer Redis com URL redis://).

## Rodando local

```bash
npm install
npm run dev
```

Abre em http://localhost:3000. Sem configurar o banco, os dados ficam em memória e somem quando o servidor reinicia.

## Publicando na Vercel

1. Importar o repositório na Vercel.
2. Em Storage, criar um banco Redis (Upstash ou Redis Cloud, plano free) e conectar ao projeto. Com Redis Cloud, deixar High Availability em "None" para aparecer o plano grátis.
3. Opcional: criar a variável `PIN_SECRET` com qualquer texto aleatório.
4. Redeploy.

## Estrutura

- `src/app`: páginas e rotas da API
- `src/components/three`: cenas 3D (boneco, lobby, presente)
- `src/components/group`: entrar no grupo, lista de presentes, chat
- `src/lib`: banco, sorteio e utilitários

O sorteio monta uma corrente única (A tira B, B tira C, ... até voltar no A) respeitando as restrições. Ninguém, nem quem organiza, consegue ver os pares.

A página consulta uma versão do grupo a cada 8 segundos e só baixa os dados de novo quando algo muda. Com a aba em segundo plano, ela para de consultar.
