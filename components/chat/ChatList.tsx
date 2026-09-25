"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bot, PhoneCall, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatListItem } from "@/lib/chat-data";
import { ChatAvatar } from "@/components/shell/ChatAvatar";
import { PageHeader } from "@/components/shell/PageHeader";
import { ChipScroller } from "@/components/chat/ChipScroller";

type Filter = "todos" | "sin_responder" | "ia" | "esperando" | "atencion" | "resueltos";

const FILTERS: { id: Filter; label: string; match: (c: ChatListItem) => boolean }[] = [
  { id: "todos", label: "Todos", match: () => true },
  { id: "sin_responder", label: "Sin responder", match: (c) => c.unanswered > 0 && c.stage !== "resuelto" },
  { id: "ia", label: "IA", match: (c) => c.status === "bot" },
  { id: "esperando", label: "Esperando asesor", match: (c) => c.stage === "esperando_asesor" },
  { id: "atencion", label: "En atención", match: (c) => c.stage === "en_atencion" },
  { id: "resueltos", label: "Resueltos", match: (c) => c.stage === "resuelto" },
];

export function ChatList({ items, activeWaId }: { items: ChatListItem[]; activeWaId: string | null }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, items.filter(f.match).length])) as Record<Filter, number>,
    [items]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = FILTERS.find((f) => f.id === filter)!.match;
    return items.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.waId.includes(q.replace(/\D/g, "") || q)) return false;
      return match(c);
    });
  }, [items, query, filter]);

  return (
    <section
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-background md:w-[380px] md:shrink-0 md:border-r md:border-ios-separator",
        activeWaId && "hidden md:flex"
      )}
    >
      <PageHeader title="Chats" className="md:pb-2" />

      {/* Buscador estilo iOS */}
      <div className="px-4 pb-2.5">
        <label className="flex h-9 items-center gap-1.5 rounded-[10px] bg-ios-grouped px-2.5 text-ios-label-2">
          <Search className="size-[17px] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nombre o número"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-ios-label-2 md:text-[15px]"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
              <X className="size-4 rounded-full bg-[#8e8e93] p-0.5 text-black" strokeWidth={3} />
            </button>
          )}
        </label>
      </div>

      {/* Filtros tipo WhatsApp */}
      <ChipScroller className="pb-3">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              type="button"
              onClick={(e) => {
                setFilter(f.id);
                e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
              }}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition-colors",
                active ? "bg-brand/15 text-brand" : "bg-ios-grouped text-[#d1d1d6] hover:bg-ios-elevated"
              )}
            >
              {f.label}
              {f.id !== "todos" && count > 0 && (
                <span className={cn("text-[12px]", active ? "text-brand/80" : "text-ios-label-2")}>{count}</span>
              )}
            </button>
          );
        })}
      </ChipScroller>

      {/* Lista */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.map((c) => {
          const selected = c.waId === activeWaId;
          return (
            <Link
              key={c.waId}
              href={`/conversaciones/${c.waId}`}
              className={cn(
                "group flex items-center gap-3 pl-4 transition-colors active:bg-white/[0.08]",
                selected ? "bg-white/[0.09]" : "hover:bg-white/[0.04]"
              )}
            >
              <ChatAvatar name={c.name} size={52} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 border-b border-ios-separator py-3 pr-4 group-last:border-transparent">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-[16.5px] font-semibold">{c.name}</span>
                  <span className={cn("shrink-0 text-[13px]", c.unanswered > 0 && c.stage !== "resuelto" ? "font-medium text-brand" : "text-ios-label-2")}>
                    {c.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="flex min-w-0 flex-1 items-center gap-1 text-[14.5px] text-ios-label-2">
                    {c.previewSender === "bot" && <Bot className="size-4 shrink-0 text-brand/70" />}
                    {c.previewSender === "llamada" && <PhoneCall className="size-4 shrink-0 text-brand/70" />}
                    {c.previewAuthor && <span className="shrink-0 text-[#c7c7cc]">{c.previewAuthor}:</span>}
                    <span className="truncate">{c.preview}</span>
                  </p>
                  {c.unanswered > 0 && c.stage !== "resuelto" && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[12px] font-bold text-on-brand">
                      {c.unanswered}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        {visible.length === 0 && (
          <p className="px-8 py-16 text-center text-[15px] text-ios-label-2">
            {query ? "No hay chats que coincidan con la búsqueda." : "No hay chats en este filtro."}
          </p>
        )}
      </div>
    </section>
  );
}
