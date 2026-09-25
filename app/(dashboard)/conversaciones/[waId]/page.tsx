import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatList } from "@/components/chat/ChatList";
import { ChatScreen, type ChatMessage } from "@/components/chat/ChatScreen";
import { getCurrentAdvisor } from "@/lib/currentAdvisor";
import { loadChatList } from "@/lib/chat-data";
import { formatClock, formatDayLabel, formatPhone } from "@/lib/chat-format";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ waId: string }> }) {
  const { waId } = await params;

  const [active, items, advisors, currentAdvisor] = await Promise.all([
    prisma.conversation.findUnique({
      where: { waId },
      include: {
        assignedAdvisor: true,
        messages: { orderBy: { createdAt: "asc" }, include: { advisor: true } },
      },
    }),
    loadChatList(),
    prisma.advisor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getCurrentAdvisor(),
  ]);

  if (!active) notFound();

  // Las fechas se formatean en el servidor (hora de Colombia) para que no
  // cambien al hidratar en el navegador.
  const now = new Date();
  const messages: ChatMessage[] = active.messages.map((m) => ({
    id: m.id.toString(),
    sender: m.sender,
    body: m.body ?? "",
    author: m.sender === "bot" ? "Asistente IA" : m.sender === "asesor" ? m.advisor?.name ?? "Asesor" : null,
    time: formatClock(m.createdAt),
    day: formatDayLabel(m.createdAt, now),
  }));

  return (
    <div className="flex min-h-0 flex-1">
      <ChatList items={items} activeWaId={active.waId} />
      <ChatScreen
        chat={{
          waId: active.waId,
          name: active.contactName ?? formatPhone(active.waId),
          phone: formatPhone(active.waId),
          stage: active.pipelineStage,
          status: active.status,
          assignedAdvisorId: active.assignedAdvisorId,
          assignedAdvisorName: active.assignedAdvisor?.name ?? null,
        }}
        messages={messages}
        advisors={advisors
          .filter((a) => currentAdvisor?.role === "admin" || a.role !== "admin" || a.id === active.assignedAdvisorId)
          .map((a) => ({ id: a.id, name: a.name, assignable: currentAdvisor?.role === "admin" || a.role !== "admin" }))}
        currentAdvisorId={currentAdvisor?.id ?? null}
      />
    </div>
  );
}
