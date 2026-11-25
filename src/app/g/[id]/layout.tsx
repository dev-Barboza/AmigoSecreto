import type { Metadata } from "next";
import { getMeta } from "@/lib/db";
import { budgetLabel } from "@/lib/format";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

/** Título e descrição do link quando ele é colado no WhatsApp. */
export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  try {
    const g = await getMeta(id);
    const description = `Entra pelo link, coloca seu nome e monta sua lista. ${budgetLabel(g.budgetMin, g.budgetMax)}.`;
    return {
      title: `${g.name} · Amigo secreto`,
      description,
      openGraph: { title: `Amigo secreto: ${g.name}`, description },
      robots: { index: false },
    };
  } catch {
    return { title: "Amigo secreto" };
  }
}

export default function GroupLayout({ children }: Props) {
  return children;
}
