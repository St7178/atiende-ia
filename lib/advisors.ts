const PALETTE = ["#2F6FED", "#E08A2C", "#8952E0", "#C4426B", "#1FAA59", "#0E7C66"];

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

export function colorForId(id: number) {
  return PALETTE[id % PALETTE.length];
}

export const STAGE_LABEL: Record<string, string> = {
  nuevo: "IA respondiendo",
  esperando_asesor: "Esperando asesor",
  en_atencion: "En atención",
  resuelto: "Resuelto",
};

export const STAGE_ORDER = ["nuevo", "esperando_asesor", "en_atencion", "resuelto"] as const;

// Colores de cada etapa para el tema oscuro (punto, badge y borde de tarjeta).
export const STAGE_THEME: Record<string, { dot: string; badge: string; cardBorder?: string }> = {
  nuevo: { dot: "#34d399", badge: "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20" },
  esperando_asesor: {
    dot: "#fbbf24",
    badge: "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/25",
    cardBorder: "rgb(251 191 36 / 0.35)",
  },
  en_atencion: { dot: "#38bdf8", badge: "bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/20" },
  resuelto: { dot: "#71717a", badge: "bg-zinc-400/10 text-zinc-300 ring-1 ring-zinc-400/20" },
};
