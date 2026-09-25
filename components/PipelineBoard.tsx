"use client";

import Link from "next/link";
import { useState } from "react";
import { STAGE_LABEL, STAGE_ORDER, STAGE_THEME } from "@/lib/advisors";
import type { ChatListItem } from "@/lib/chat-data";
import { ChatAvatar } from "@/components/shell/ChatAvatar";
import { cn } from "@/lib/utils";

type Stage = (typeof STAGE_ORDER)[number];

const SHORT_LABEL: Record<Stage, string> = {
  nuevo: "IA",
  esperando_asesor: "Espera",
  en_atencion: "Atención",
  resuelto: "Resueltos",
};

export function PipelineBoard({ items }: { items: ChatListItem[] }) {
  const [mobileStage, setMobileStage] = useState<Stage>("esperando_asesor");

  const byStage = Object.fromEntries(STAGE_ORDER.map((s) => [s, [] as ChatListItem[]])) as Record<Stage, ChatListItem[]>;
  for (const c of items) (byStage[c.stage as Stage] ?? byStage.nuevo).push(c);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Control segmentado estilo iOS (solo movil) */}
      <div className="mx-4 mb-3 grid shrink-0 grid-cols-4 rounded-[9px] bg-ios-grouped p-0.5 md:hidden">
        {STAGE_ORDER.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setMobileStage(stage)}
            className={cn(
              "rounded-[7px] py-1.5 text-[13px] font-medium transition-colors",
              mobileStage === stage ? "bg-[#636366] text-white shadow-sm" : "text-[#d1d1d6]"
            )}
          >
            {SHORT_LABEL[stage]} <span className="text-[11px] opacity-70">{byStage[stage].length}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 gap-4 px-4 pb-4 md:grid md:grid-cols-4 md:px-6 md:pb-6">
        {STAGE_ORDER.map((stage) => {
          const theme = STAGE_THEME[stage];
          const list = byStage[stage];
          return (
            <div
              key={stage}
              className={cn(
                "min-h-0 flex-1 flex-col rounded-2xl md:flex md:border md:border-ios-separator md:bg-[#0e0e10] md:p-3",
                mobileStage === stage ? "flex" : "hidden"
              )}
            >
              <div className="mb-2 hidden items-center gap-2 px-1 md:flex">
                <span className="size-2 rounded-full" style={{ background: theme.dot }} />
                <span className="text-[15px] font-semibold">{STAGE_LABEL[stage]}</span>
                <span className="ml-auto rounded-full bg-ios-grouped px-2 py-0.5 text-[12px] font-semibold text-ios-label-2">
                  {list.length}
                </span>
              </div>
              <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
                {list.map((c) => (
                  <Link
                    key={c.waId}
                    href={`/conversaciones/${c.waId}`}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl bg-ios-grouped p-3 transition-colors hover:bg-ios-elevated active:bg-ios-elevated",
                      stage === "resuelto" && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <ChatAvatar name={c.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold">{c.name}</div>
                        <div className="truncate text-[12.5px] text-ios-label-2">+{c.waId}</div>
                      </div>
                      <span className="shrink-0 self-start text-[12px] text-ios-label-2">{c.time}</span>
                    </div>
                    <p className="line-clamp-2 text-[13.5px] leading-snug text-[#c7c7cc]">{c.preview}</p>
                    <div className="flex items-center gap-2">
                      {c.assignedAdvisorName ? (
                        <span className="flex items-center gap-1.5 text-[12.5px] text-ios-label-2">
                          <ChatAvatar name={c.assignedAdvisorName} size={18} color="var(--brand)" className="text-on-brand" />
                          {c.assignedAdvisorName}
                        </span>
                      ) : (
                        stage !== "resuelto" && <span className="text-[12.5px] text-ios-label-2">Sin asignar</span>
                      )}
                      {c.unanswered > 0 && stage !== "resuelto" && (
                        <span className="ml-auto rounded-full bg-brand/15 px-2 py-0.5 text-[11.5px] font-semibold text-brand">
                          {c.unanswered} sin responder
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {list.length === 0 && (
                  <p className="px-2 py-10 text-center text-[14px] text-ios-label-2">Sin conversaciones aquí.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
