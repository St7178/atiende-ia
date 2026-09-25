import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/elevenlabs";

// Webhook de fin de llamada de ElevenLabs (Agents -> Settings -> Post-call webhook).
// Guarda el resultado de la llamada como mensaje "llamada" en el chat y, si el
// agente cerro la venta, mueve la conversacion en el pipeline.

type DataCollection = Record<string, { value?: unknown } | undefined>;

type PostCallEvent =
  | {
      type: "post_call_transcription";
      data: {
        conversation_id: string;
        metadata?: { call_duration_secs?: number };
        analysis?: {
          call_successful?: string;
          transcript_summary?: string;
          data_collection_results?: DataCollection;
        };
        conversation_initiation_client_data?: { dynamic_variables?: Record<string, unknown> };
      };
    }
  | {
      type: "call_initiation_failure";
      data: {
        conversation_id: string;
        failure_reason?: string;
        conversation_initiation_client_data?: { dynamic_variables?: Record<string, unknown> };
      };
    }
  | { type: string; data: { conversation_id?: string } };

const FAILURE_REASON: Record<string, string> = {
  busy: "el número estaba ocupado",
  "no-answer": "el cliente no contestó",
};

function collected(results: DataCollection | undefined, key: string) {
  const value = results?.[key]?.value;
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function formatDuration(secs: number | undefined) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, "0")} min`;
}

export async function POST(request: Request) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ELEVENLABS_WEBHOOK_SECRET no configurado" }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("elevenlabs-signature"), secret)) {
    return NextResponse.json({ error: "firma invalida" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PostCallEvent;
  if (event.type !== "post_call_transcription" && event.type !== "call_initiation_failure") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const data = event.data as {
    conversation_id: string;
    conversation_initiation_client_data?: { dynamic_variables?: Record<string, unknown> };
  };
  const waId = String(data.conversation_initiation_client_data?.dynamic_variables?.wa_id ?? "");
  if (!waId) return NextResponse.json({ ok: true, ignored: "sin wa_id" });

  const conversation = await prisma.conversation.findUnique({ where: { waId } });
  if (!conversation) return NextResponse.json({ ok: true, ignored: "conversacion no encontrada" });

  // ElevenLabs puede reintentar el webhook: no duplicar el resultado.
  const marker = `elevenlabs:${data.conversation_id}:fin`;
  if (await prisma.message.findFirst({ where: { wamid: marker } })) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let body: string;
  let saleClosed = false;

  if (event.type === "call_initiation_failure") {
    const reason = (event.data as { failure_reason?: string }).failure_reason ?? "unknown";
    body = `Llamada con IA no conectada: ${FAILURE_REASON[reason] ?? "no se pudo establecer la llamada"}.`;
  } else {
    const d = (event as Extract<PostCallEvent, { type: "post_call_transcription" }>).data;
    const results = d.analysis?.data_collection_results;
    saleClosed = collected(results, "venta_cerrada")?.toLowerCase() === "true";

    const header = [
      "Llamada con IA finalizada",
      formatDuration(d.metadata?.call_duration_secs),
      saleClosed ? "Venta cerrada ✅" : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const details = [
      ["Servicio", collected(results, "servicio_solicitado")],
      ["Visita", collected(results, "fecha_visita")],
      ["Dirección", collected(results, "direccion")],
      ["Objeciones", collected(results, "objeciones")],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);

    body = [header, d.analysis?.transcript_summary?.trim(), ...details].filter(Boolean).join("\n");
  }

  await prisma.message.create({ data: { waId, wamid: marker, sender: "llamada", body } });
  await prisma.conversation.update({
    where: { waId },
    data: saleClosed
      ? { lastMessageAt: new Date(), status: "resuelto", pipelineStage: "resuelto" }
      : { lastMessageAt: new Date() },
  });

  revalidatePath(`/conversaciones/${waId}`);
  revalidatePath("/pipeline");
  return NextResponse.json({ ok: true });
}
