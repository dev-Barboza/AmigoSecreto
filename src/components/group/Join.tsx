"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { boom, Button, Card, Field, Preview3D } from "@/components/ui";
import { api, resizePhoto, session } from "@/lib/client";
import { BODY_COLORS } from "@/lib/format";
import type { Theme } from "@/lib/theme";
import type { PublicParticipant } from "@/lib/types";

export function PhotoPicker({ value, onChange, color }: { value?: string; onChange: (v: string | undefined) => void; color: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-line bg-ink transition hover:border-muted"
        style={value ? { borderStyle: "solid", borderColor: color } : undefined}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )}
      </button>
      <div className="space-y-2">
        <p className="text-sm text-muted">{busy ? "Carregando..." : "A foto vira o rosto do boneco."}</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="px-3 py-2 text-sm" onClick={() => input.current?.click()}>
            {value ? "Trocar foto" : "Escolher foto"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" className="px-3 py-2 text-sm" onClick={() => onChange(undefined)}>
              Tirar
            </Button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            onChange(await resizePhoto(file));
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {BODY_COLORS.map((c) => (
        <motion.button
          type="button"
          key={c}
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(c)}
          className="h-9 w-9 rounded-full"
          style={{ background: c, boxShadow: value === c ? `0 0 0 3px #172538, 0 0 0 5px #f4ecdf` : "none" }}
          aria-label={`Cor ${c}`}
        />
      ))}
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  autoFocus,
  autoComplete = "current-password",
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className="input w-full pr-20"
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        maxLength={64}
        autoFocus={autoFocus}
        placeholder="Mínimo 4 caracteres"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute inset-y-0 right-3 text-sm font-semibold text-muted hover:text-cream"
      >
        {show ? "Esconder" : "Mostrar"}
      </button>
    </div>
  );
}

/** Formulário de nome + senha, usado dentro do grupo e na página /entrar. */
export function NamePasswordForm({
  onSubmit,
  submitLabel = "Entrar",
}: {
  onSubmit: (name: string, password: string) => Promise<void>;
  submitLabel?: string;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          await onSubmit(name, password);
        } finally {
          setLoading(false);
        }
      }}
    >
      <Field label="Seu nome" hint="O mesmo nome que você usou quando entrou no grupo.">
        <input
          className="input w-full"
          autoComplete="username"
          autoFocus
          maxLength={40}
          placeholder="Como você se cadastrou"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Sua senha">
        <PasswordInput value={password} onChange={setPassword} />
      </Field>
      <Button type="submit" className="w-full" disabled={!name.trim() || password.length < 4} loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}

/** Monta o boneco: nome e foto, cor, senha. O boneco 3D ao lado atualiza na hora. */
export function JoinFlow({ gid, onJoined, onError, theme }: { gid: string; onJoined: () => void; onError: (m: string) => void; theme?: Theme }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [color, setColor] = useState(BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    setLoading(true);
    try {
      const s = await api<{ participantId: string; token: string }>(`/api/groups/${gid}/join`, { body: { name, photo, color, password } });
      session.set(gid, s);
      boom("big");
      onJoined();
    } catch (e) {
      onError((e as Error).message);
      setLoading(false);
    }
  }

  const steps = [
    { title: "Monte seu boneco", ok: name.trim().length > 0 },
    { title: theme === "tribunal" ? "Cor da gravata" : "Cor da roupa", ok: true },
    { title: "Crie uma senha", ok: password.length >= 4 },
  ];

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <div className="relative h-80 overflow-hidden rounded-[20px] border border-line bg-ink lg:h-auto lg:min-h-[460px]">
        <Preview3D name={name || undefined} photo={photo} color={color} mode={step === 2 ? "dance" : "wave"} className="h-full w-full" theme={theme} />
      </div>
      <Card>
        <p className="mb-1 text-sm font-semibold text-muted">
          {step + 1} de 3
        </p>
        <AnimatePresence mode="wait">
          <motion.form
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!steps[step].ok) return;
              if (step < 2) setStep(step + 1);
              else join();
            }}
          >
            <h2 className="font-display text-2xl font-semibold">{steps[step].title}</h2>
            {step === 0 && (
              <>
                <Field label="Seu nome">
                  <input className="input" autoFocus maxLength={40} placeholder="Como te chamam" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <PhotoPicker value={photo} onChange={setPhoto} color={color} />
              </>
            )}
            {step === 1 && <ColorPicker value={color} onChange={setColor} />}
            {step === 2 && (
              <Field
                label="Sua senha"
                hint={`Para entrar de novo é só digitar seu nome (${name.trim() || "como você escreveu"}) e essa senha. Anote em algum lugar.`}
              >
                <PasswordInput value={password} onChange={setPassword} autoFocus autoComplete="new-password" />
              </Field>
            )}
            <div className="flex justify-between">
              {step > 0 ? (
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                  Voltar
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" variant={step === 2 ? "gold" : "red"} disabled={!steps[step].ok} loading={loading}>
                {step === 2 ? "Entrar no grupo" : "Continuar"}
              </Button>
            </div>
          </motion.form>
        </AnimatePresence>
      </Card>
    </div>
  );
}

/** Quem já entrou: digita o nome e a senha. */
export function LoginFlow({ gid, onJoined, onError }: { gid: string; people?: PublicParticipant[]; onJoined: () => void; onError: (m: string) => void }) {
  return (
    <Card>
      <h2 className="mb-4 font-display text-2xl font-semibold">Entrar de novo</h2>
      <NamePasswordForm
        onSubmit={async (name, password) => {
          try {
            const s = await api<{ participantId: string; token: string }>(`/api/groups/${gid}/login`, { body: { name, password } });
            session.set(gid, s);
            onJoined();
          } catch (err) {
            onError((err as Error).message);
          }
        }}
      />
    </Card>
  );
}
