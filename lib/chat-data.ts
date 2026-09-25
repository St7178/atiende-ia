import { prisma } from "@/lib/prisma";
import { formatListTime } from "@/lib/chat-format";

export type ChatListItem = {
  waId: string;
  name: string;
  preview: string;
  previewSender: string | null;
  previewAuthor: string | null;
  time: string;
  // Mensajes del cliente que llegaron despues de la ultima respuesta (IA o asesor).
  unanswered: number;
  stage: string;
  status: string;
  assignedAdvisorId: number | null;
  assignedAdvisorName: string | null;
};

export async function loadChatList(): Promise<ChatListItem[]> {
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      assignedAdvisor: true,
      messages: { orderBy: { createdAt: "desc" }, take: 20, include: { advisor: true } },
    },
  });

  const now = new Date();
  return conversations.map((c) => {
    const last = c.messages[0];
    let unanswered = 0;
    for (const m of c.messages) {
      if (m.sender !== "cliente") break;
      unanswered++;
    }

    return {
      waId: c.waId,
      name: c.contactName ?? c.waId,
      preview: last?.body ?? "Sin mensajes",
      previewSender: last?.sender ?? null,
      previewAuthor: last?.sender === "asesor" ? last.advisor?.name.split(" ")[0] ?? "Asesor" : null,
      time: formatListTime(last?.createdAt ?? c.lastMessageAt, now),
      unanswered,
      stage: c.pipelineStage,
      status: c.status,
      assignedAdvisorId: c.assignedAdvisorId,
      assignedAdvisorName: c.assignedAdvisor?.name ?? null,
    };
  });
}

export async function countWaitingChats() {
  return prisma.conversation.count({ where: { pipelineStage: "esperando_asesor" } });
}
