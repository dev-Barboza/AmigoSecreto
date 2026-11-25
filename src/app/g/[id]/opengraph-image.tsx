import { ImageResponse } from "next/og";
import { getMeta, getPeople } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Convite do amigo secreto";

/** Imagem que aparece no WhatsApp: nome do grupo e quantas pessoas já entraram. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let name = "Amigo secreto";
  let count = 0;
  let court = false;
  try {
    const [g, people] = await Promise.all([getMeta(id), getPeople(id)]);
    name = g.name;
    count = people.length;
    court = g.theme === "tribunal";
  } catch {}

  const bg = court ? "#1b1410" : "#0f1b2d";
  const accent = court ? "#d4a537" : "#d94a3d";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: bg, color: "#f4ecdf", padding: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, color: "#9fadc0" }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: accent }} />
          amigo secreto
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: name.length > 18 ? 96 : 140, fontWeight: 700, lineHeight: 1 }}>{name}</div>
          <div style={{ marginTop: 28, fontSize: 38, color: "#9fadc0" }}>
            {count === 0 ? "Seja o primeiro a entrar." : count === 1 ? "1 pessoa já entrou." : `${count} pessoas já entraram.`}
          </div>
        </div>
        <div style={{ display: "flex", height: 10, width: "100%" }}>
          {(court ? ["#151515", "#ece6da", "#d4a537", "#7f1d1d"] : ["#d94a3d", "#f0b54a", "#3e8e5e", "#f4ecdf"]).map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
