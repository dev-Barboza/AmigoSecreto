import { constants, createPrivateKey, generateKeyPairSync, privateDecrypt, publicEncrypt, scryptSync } from "crypto";

/**
 * Sorteio trancado com a senha de cada pessoa.
 *
 * - Ao entrar, cada pessoa ganha um par de chaves RSA. A chave privada é guardada
 *   cifrada com uma chave derivada da senha dela (que o banco não tem).
 * - No sorteio, "quem eu tirei" é cifrado com a chave pública de cada um.
 *   A lista aberta de pares nunca é salva.
 * - Para abrir, a pessoa manda a senha; o servidor decifra só naquela hora.
 *
 * Quem olha o banco vê só texto embaralhado.
 */

/** chave que tranca a chave privada: scrypt(senha), com o id da pessoa como sal */
const passKey = (pid: string, password: string) => scryptSync(password, `amigo-secreto:key:${pid}`, 32).toString("hex");

const OAEP = { padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" } as const;

export function makeKeys(pid: string, password: string) {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem", cipher: "aes-256-cbc", passphrase: passKey(pid, password) },
  });
  return { pubKey: publicKey, encPriv: privateKey };
}

/** Tranca um texto para que só o dono da chave pública consiga abrir. */
export function sealFor(pubKey: string, text: string) {
  return publicEncrypt({ key: pubKey, ...OAEP }, Buffer.from(text, "utf8")).toString("base64");
}

/** Abre com a senha da pessoa. Devolve null se a senha não abre a chave (ex.: senha trocada depois). */
export function openWith(p: { id: string; encPriv?: string }, password: string, sealed: string): string | null {
  if (!p.encPriv) return null;
  try {
    const key = createPrivateKey({ key: p.encPriv, format: "pem", passphrase: passKey(p.id, password) });
    return privateDecrypt({ key, ...OAEP }, Buffer.from(sealed, "base64")).toString("utf8");
  } catch {
    return null;
  }
}
