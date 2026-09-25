"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/n8n";
import { getCurrentAdvisor } from "@/lib/currentAdvisor";
import { startOutboundCall } from "@/lib/elevenlabs";
import { brand } from "@/lib/brand";

export async function reassignConversation(waId: string, advisorId: number | null) {
  if (advisorId !== null) {
    const [current, target] = await Promise.all([
      getCurrentAdvisor(),
      prisma.advisor.findUnique({ where: { id: advisorId } }),
    ]);
    if (!target?.isActive) throw new Error("El asesor no existe o está inactivo.");
    if (target.role === "admin" && current?.role !== "admin" && target.id !== current?.id) {
      throw new Error("Solo un administrador puede asignar chats a un administrador.");
    }
  }

  await prisma.conversation.update({
    where: { waId },
    data: {
      assignedAdvisorId: advisorId,
      status: advisorId ? "human" : "pendiente_humano",
      pipelineStage: advisorId ? "en_atencion" : "esperando_asesor",
    },
  });

  revalidatePath(`/conversaciones/${waId}`);
  revalidatePath("/pipeline");
}

export async function takeConversation(waId: string) {
  const advisor = await getCurrentAdvisor();
  if (!advisor) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");

  await reassignConversation(waId, advisor.id);
}

export type SendMessageResult = { ok: true } | { ok: false; error: string };

export async function sendMessage(waId: string, text: string): Promise<SendMessageResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "El mensaje esta vacio." };

  const advisor = await getCurrentAdvisor();
  if (!advisor) {
    return {
      ok: false,
      error: "Tu sesión expiró. Vuelve a iniciar sesión.",
    };
  }

  // n8n envia el mensaje por WhatsApp y lo registra en la tabla `messages`
  // (workflow 02-portal-outbound-asesor.json).
  try {
    await sendWhatsAppMessage({ waId, advisorId: advisor.id, message: trimmed });
  } catch (e) {
    console.error("Error enviando mensaje por n8n:", e);
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo enviar el mensaje." };
  }

  await prisma.conversation.update({
    where: { waId },
    data: { assignedAdvisorId: advisor.id, status: "human", pipelineStage: "en_atencion" },
  });

  revalidatePath(`/conversaciones/${waId}`);
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function markResolved(waId: string) {
  await prisma.conversation.update({
    where: { waId },
    data: { status: "resuelto", pipelineStage: "resuelto" },
  });

  revalidatePath(`/conversaciones/${waId}`);
  revalidatePath("/pipeline");
}

// Devuelve la conversacion al asistente de IA: el flujo de n8n solo responde
// automaticamente cuando status = 'bot'.
export async function returnToBot(waId: string) {
  await prisma.conversation.update({
    where: { waId },
    data: { assignedAdvisorId: null, status: "bot", pipelineStage: "nuevo" },
  });

  revalidatePath(`/conversaciones/${waId}`);
  revalidatePath("/pipeline");
}

export type StartCallResult = { ok: true } | { ok: false; error: string };

// Llama al cliente con el agente de voz de ElevenLabs (via Twilio). El agente
// recibe el nombre del cliente y las ultimas lineas del chat como contexto.
export async function startAiCall(waId: string): Promise<StartCallResult> {
  const [conversation, advisor] = await Promise.all([
    prisma.conversation.findUnique({
      where: { waId },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 12 } },
    }),
    getCurrentAdvisor(),
  ]);
  if (!conversation) return { ok: false, error: "La conversacion no existe." };

  const history = conversation.messages
    .filter((m) => m.body && m.sender !== "llamada")
    .reverse()
    .map((m) => `${m.sender === "cliente" ? "Cliente" : m.sender === "bot" ? "Asistente" : "Asesor"}: ${m.body}`)
    .join("\n")
    .slice(-1500);

  let conversationId: string | null;
  try {
    ({ conversationId } = await startOutboundCall({
      toNumber: `+${waId}`,
      dynamicVariables: {
        wa_id: waId,
        nombre_cliente: conversation.contactName ?? "cliente",
        asesor: advisor?.name ?? brand.teamName,
        historial_chat: history || "Sin mensajes previos.",
      },
    }));
  } catch (e) {
    console.error("Error iniciando llamada con ElevenLabs:", e);
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo iniciar la llamada." };
  }

  // Queda registrada en el chat; el resultado llega por el webhook de fin de llamada.
  await prisma.message.create({
    data: {
      waId,
      wamid: conversationId ? `elevenlabs:${conversationId}:inicio` : null,
      sender: "llamada",
      advisorId: advisor?.id ?? null,
      body: `Llamada con IA iniciada${advisor ? ` por ${advisor.name}` : ""}.`,
    },
  });
  await prisma.conversation.update({ where: { waId }, data: { lastMessageAt: new Date() } });

  revalidatePath(`/conversaciones/${waId}`);
  revalidatePath("/pipeline");
  return { ok: true };
}
