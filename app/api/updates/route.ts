import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// "Version" de los datos que muestra el portal. El navegador la consulta cada
// pocos segundos (components/LiveUpdates.tsx) y solo recarga la pantalla cuando
// cambia: mensaje nuevo, cambio de estado, asignacion o nuevo chat.
export async function GET() {
  const [row] = await prisma.$queryRaw<{ version: string | null }[]>`
    select concat_ws(':',
      (select coalesce(max(id), 0) from messages),
      (select md5(coalesce(string_agg(
        wa_id || '|' || status || '|' || pipeline_stage || '|' || coalesce(assigned_advisor_id, 0),
        ',' order by wa_id), '')) from conversations)
    ) as version`;

  return NextResponse.json({ version: row?.version ?? "" }, { headers: { "cache-control": "no-store" } });
}
