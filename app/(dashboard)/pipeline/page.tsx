import { Bot, CircleCheck, Headset, MessageCircle } from "lucide-react";
import { PipelineBoard } from "@/components/PipelineBoard";
import { PageHeader } from "@/components/shell/PageHeader";
import { loadChatList } from "@/lib/chat-data";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const items = await loadChatList();

  const count = (stage: string) => items.filter((c) => c.stage === stage).length;
  const resolved = count("resuelto");

  const stats = [
    { label: "Activas", value: items.length - resolved, icon: MessageCircle, color: "#ffffff" },
    { label: "Esperando asesor", value: count("esperando_asesor"), icon: Headset, color: "var(--brand)" },
    { label: "Con la IA", value: count("nuevo"), icon: Bot, color: "#34d399" },
    { label: "Resueltas", value: resolved, icon: CircleCheck, color: "#8e8e93" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:overflow-hidden">
      <PageHeader title="Pipeline" subtitle="Estado de todas las conversaciones de WhatsApp" />

      <div className="grid shrink-0 grid-cols-2 gap-2.5 px-4 pb-4 md:grid-cols-4 md:gap-4 md:px-6 md:pb-5">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-2 rounded-2xl bg-ios-grouped p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ios-label-2">{s.label}</span>
              <s.icon className="size-[18px]" style={{ color: s.color }} />
            </div>
            <span className="text-[30px] font-bold leading-none tracking-[-0.02em]" style={{ color: s.color }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <PipelineBoard items={items} />
    </div>
  );
}
