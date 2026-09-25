"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  CircleCheck,
  Copy,
  Hand,
  Info,
  MessageCircle,
  Phone,
  PhoneCall,
  PhoneOutgoing,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { STAGE_LABEL, STAGE_THEME } from "@/lib/advisors";
import { ChatAvatar } from "@/components/shell/ChatAvatar";
import { MessageComposer } from "@/components/MessageComposer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markResolved,
  reassignConversation,
  returnToBot,
  startAiCall,
  takeConversation,
} from "@/app/(dashboard)/conversaciones/actions";

export type ChatMessage = {
  id: string;
  sender: string;
  body: string;
  author: string | null;
  time: string;
  day: string;
};

export type ActiveChat = {
  waId: string;
  name: string;
  phone: string;
  stage: string;
  status: string;
  assignedAdvisorId: number | null;
  assignedAdvisorName: string | null;
};

function statusText(chat: ActiveChat) {
  if (chat.assignedAdvisorName) return `Atendido por ${chat.assignedAdvisorName}`;
  if (chat.status === "bot") return "El asistente IA está respondiendo";
  return STAGE_LABEL[chat.stage] ?? "Esperando asesor";
}

function lockedReason(chat: ActiveChat) {
  if (chat.assignedAdvisorName) return `${chat.assignedAdvisorName} atiende este chat.`;
  if (chat.status === "bot") return "El asistente IA está respondiendo.";
  return "El cliente espera a un asesor.";
}

export function ChatScreen({
  chat,
  messages,
  advisors,
  currentAdvisorId,
}: {
  chat: ActiveChat;
  messages: ChatMessage[];
  advisors: { id: number; name: string; assignable: boolean }[];
  currentAdvisorId: number | null;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const aiCall = useAiCall(chat);

  return (
    <div className="relative flex min-w-0 flex-1">
      <section className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader chat={chat} onOpenInfo={() => setInfoOpen((v) => !v)} infoOpen={infoOpen} aiCall={aiCall} />
        {aiCall.notice && (
          <div
            role="status"
            className={cn(
              "absolute left-1/2 top-[68px] z-20 w-[min(92%,420px)] -translate-x-1/2 rounded-2xl px-4 py-2.5 text-center text-[13.5px] font-medium shadow-lg backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-2",
              aiCall.notice.kind === "error" ? "bg-[#3a1614]/95 text-[#ffb4ae]" : "bg-[#2c2c2e]/95 text-white"
            )}
          >
            {aiCall.notice.text}
          </div>
        )}
        <MessageList key={chat.waId} messages={messages} />
        <MessageComposer
          waId={chat.waId}
          canSend={currentAdvisorId !== null && chat.assignedAdvisorId === currentAdvisorId}
          lockedReason={lockedReason(chat)}
        />
      </section>

      {infoOpen && (
        <ContactInfo
          chat={chat}
          advisors={advisors}
          currentAdvisorId={currentAdvisorId}
          onClose={() => setInfoOpen(false)}
          aiCall={aiCall}
        />
      )}
    </div>
  );
}

type AiCall = ReturnType<typeof useAiCall>;

// Inicia la llamada con el agente de voz de ElevenLabs y muestra el resultado.
function useAiCall(chat: ActiveChat) {
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function start() {
    if (isPending) return;
    if (!window.confirm(`¿Llamar a ${chat.name} (${chat.phone}) con el agente de voz de IA?`)) return;
    setNotice({ kind: "ok", text: "Iniciando llamada con IA..." });
    startTransition(async () => {
      const result = await startAiCall(chat.waId);
      setNotice(
        result.ok
          ? { kind: "ok", text: `Llamando a ${chat.name}. El resumen aparecerá en el chat al colgar.` }
          : { kind: "error", text: result.error }
      );
      setTimeout(() => setNotice(null), result.ok ? 5000 : 9000);
    });
  }

  return { start, isPending, notice };
}

function ChatHeader({
  chat,
  onOpenInfo,
  infoOpen,
  aiCall,
}: {
  chat: ActiveChat;
  onOpenInfo: () => void;
  infoOpen: boolean;
  aiCall: AiCall;
}) {
  return (
    <header className="z-10 flex h-[60px] shrink-0 items-center gap-1 border-b border-ios-separator bg-[#161617]/85 px-1.5 backdrop-blur-xl md:gap-2 md:px-4">
      <Link
        href="/conversaciones"
        className="flex items-center text-brand md:hidden"
        aria-label="Volver a chats"
      >
        <ChevronLeft className="size-8" strokeWidth={2.2} />
      </Link>
      <button type="button" onClick={onOpenInfo} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <ChatAvatar name={chat.name} size={38} />
        <span className="min-w-0">
          <span className="block truncate text-[16.5px] font-semibold leading-tight">{chat.name}</span>
          <span className="block truncate text-[12.5px] text-ios-label-2">{statusText(chat)}</span>
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Llamar"
          disabled={aiCall.isPending}
          className="grid size-10 place-items-center rounded-full text-brand outline-none hover:bg-white/[0.06] disabled:opacity-50"
        >
          <Phone className="size-[21px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60 rounded-xl p-1.5">
          <DropdownMenuItem onSelect={aiCall.start} className="rounded-lg py-2.5 text-[15px]">
            <Sparkles className="text-brand" />
            <span className="flex flex-col">
              Llamar con IA
              <span className="text-[12px] text-ios-label-2">El agente de voz llama al cliente</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg py-2.5 text-[15px]">
            <a href={`tel:+${chat.waId}`}>
              <PhoneOutgoing className="text-brand" />
              <span className="flex flex-col">
                Llamar desde mi teléfono
                <span className="text-[12px] text-ios-label-2">{chat.phone}</span>
              </span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        onClick={onOpenInfo}
        aria-label="Info. del contacto"
        className={cn("grid size-10 place-items-center rounded-full text-brand hover:bg-white/[0.06]", infoOpen && "bg-white/[0.08]")}
      >
        <Info className="size-[22px]" />
      </button>
    </header>
  );
}

function BubbleTail({ side, className }: { side: "left" | "right"; className: string }) {
  return (
    <svg
      viewBox="0 0 8 13"
      aria-hidden
      className={cn("absolute top-0 h-[13px] w-2", side === "right" ? "-right-[7px]" : "-left-[7px] -scale-x-100", className)}
    >
      <path fill="currentColor" d="M0 0h5.19c1.73 0 2.6 2.09 1.38 3.31L0 10.5z" />
    </svg>
  );
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="sticky top-2 z-[1] mx-auto my-3 rounded-lg bg-[#1c1c1e]/90 px-3 py-1 text-[12.5px] font-medium text-[#d1d1d6] shadow-sm backdrop-blur">
      {label}
    </div>
  );
}

// Registro de una llamada con IA, centrado como los avisos de llamada de WhatsApp.
function CallCard({ message }: { message: ChatMessage }) {
  const [title, ...rest] = message.body.split("\n");
  const failed = title.startsWith("Llamada con IA no conectada");
  return (
    <div className="mx-auto my-2 w-full max-w-[440px] rounded-2xl border border-white/[0.06] bg-[#1c1c1e]/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full",
            failed ? "bg-[#ff453a]/15 text-[#ff6961]" : "bg-brand/15 text-brand"
          )}
        >
          <PhoneCall className="size-4" />
        </span>
        <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug">{title}</span>
        <span className="shrink-0 text-[11px] text-ios-label-2">{message.time}</span>
      </div>
      {rest.length > 0 && (
        <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#d1d1d6]">{rest.join("\n")}</p>
      )}
    </div>
  );
}

function MessageList({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement>(null);

  // Bajar al ultimo mensaje al abrir el chat y cuando llegan mensajes nuevos.
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={ref} className="chat-wallpaper min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[920px] flex-col px-3 pb-3 pt-2 md:px-[5%]">
        {messages.length === 0 && (
          <div className="mx-auto mt-6 rounded-xl bg-[#1c1c1e]/90 px-4 py-2 text-[13px] text-[#d1d1d6]">
            Aún no hay mensajes en este chat.
          </div>
        )}

        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || prev.day !== m.day;

          if (m.sender === "llamada") {
            return (
              <Fragment key={m.id}>
                {newDay && <DaySeparator label={m.day} />}
                <CallCard message={m} />
              </Fragment>
            );
          }

          const isOut = m.sender !== "cliente";
          const first =
            newDay || !prev || prev.sender !== m.sender || prev.author !== m.author || prev.sender === "llamada";
          const isBot = m.sender === "bot";

          const bubble = isBot
            ? "bg-bubble-bot text-on-bubble-bot"
            : isOut
              ? "bg-bubble-out text-on-brand"
              : "bg-bubble-in text-white";
          const tail = isBot ? "text-bubble-bot" : isOut ? "text-bubble-out" : "text-bubble-in";

          return (
            <Fragment key={m.id}>
              {newDay && <DaySeparator label={m.day} />}
              <div className={cn("flex", isOut ? "justify-end" : "justify-start", first ? "mt-2" : "mt-[3px]")}>
                <div
                  className={cn(
                    "relative max-w-[85%] rounded-[18px] px-3 pb-[7px] pt-[6px] text-[15.5px] leading-[1.35] shadow-[0_1px_0.5px_rgba(0,0,0,0.25)] md:max-w-[65%]",
                    bubble,
                    first && (isOut ? "rounded-tr-[4px]" : "rounded-tl-[4px]")
                  )}
                >
                  {first && <BubbleTail side={isOut ? "right" : "left"} className={tail} />}
                  {first && m.author && (
                    <div
                      className={cn(
                        "mb-0.5 flex items-center gap-1 text-[13px] font-semibold",
                        isBot ? "text-brand" : "text-bubble-out-author"
                      )}
                    >
                      {isBot && <Bot className="size-3.5" />}
                      {m.author}
                    </div>
                  )}
                  <span className="whitespace-pre-wrap break-words">{m.body}</span>
                  {/* Espacio reservado para la hora, como en WhatsApp */}
                  <span className="inline-block w-[68px]" aria-hidden />
                  <span
                    className={cn(
                      "absolute bottom-[5px] right-3 text-[11px] leading-none",
                      isBot ? "text-on-bubble-bot/55" : isOut ? "text-on-brand/60" : "text-white/45"
                    )}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ContactInfo({
  chat,
  advisors,
  currentAdvisorId,
  onClose,
  aiCall,
}: {
  chat: ActiveChat;
  advisors: { id: number; name: string; assignable: boolean }[];
  currentAdvisorId: number | null;
  onClose: () => void;
  aiCall: AiCall;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const theme = STAGE_THEME[chat.assignedAdvisorName ? "en_atencion" : chat.stage] ?? STAGE_THEME.nuevo;

  const canTake = chat.assignedAdvisorId !== currentAdvisorId && chat.stage !== "resuelto" && currentAdvisorId !== null;

  function copyNumber() {
    navigator.clipboard?.writeText(`+${chat.waId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <aside className="fixed inset-0 z-40 flex flex-col bg-black animate-in slide-in-from-right-8 fade-in-0 duration-200 md:absolute md:inset-y-0 md:left-auto md:right-0 md:z-20 md:w-[360px] md:border-l md:border-ios-separator md:shadow-[-12px_0_32px_rgba(0,0,0,0.5)] xl:static xl:z-auto xl:shrink-0 xl:shadow-none xl:animate-none">
      <header className="flex h-[60px] shrink-0 items-center gap-2 border-b border-ios-separator bg-[#161617]/85 px-2 backdrop-blur-xl md:px-4">
        <button type="button" onClick={onClose} className="flex items-center text-[17px] text-brand md:hidden">
          <ChevronLeft className="size-8" strokeWidth={2.2} /> Chat
        </button>
        <span className="flex-1 text-center text-[16.5px] font-semibold md:text-left">Info. del contacto</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="hidden size-9 place-items-center rounded-full text-ios-label-2 hover:bg-white/[0.06] md:grid"
        >
          <X className="size-5" />
        </button>
        <span className="w-[72px] md:hidden" aria-hidden />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10">
        <div className="flex flex-col items-center gap-1.5 pb-5 pt-7 text-center">
          <ChatAvatar name={chat.name} size={96} />
          <h2 className="mt-2 text-[22px] font-bold leading-tight">{chat.name}</h2>
          <p className="text-[16px] text-ios-label-2">{chat.phone}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button type="button" onClick={aiCall.start} disabled={aiCall.isPending} className="ios-tile disabled:opacity-50">
            <Sparkles className="size-5" /> Llamar IA
          </button>
          <a href={`tel:+${chat.waId}`} className="ios-tile">
            <Phone className="size-5" /> Llamar
          </a>
          <a href={`https://wa.me/${chat.waId}`} target="_blank" rel="noreferrer" className="ios-tile">
            <MessageCircle className="size-5" /> WhatsApp
          </a>
          <button type="button" onClick={copyNumber} className="ios-tile">
            {copied ? <Check className="size-5" /> : <Copy className="size-5" />} {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        <p className="ios-section-title">Atención</p>
        <div className="ios-group">
          <div className="ios-row">
            <span className="flex-1">Estado</span>
            <span className="flex items-center gap-2 text-ios-label-2">
              <span className="size-2 rounded-full" style={{ background: theme.dot }} />
              {chat.assignedAdvisorName ? "En atención" : STAGE_LABEL[chat.stage] ?? chat.stage}
            </span>
          </div>
          <label className="ios-row">
            <span className="flex-1">Asignado a</span>
            <span className="relative flex items-center text-ios-label-2">
              <select
                key={chat.assignedAdvisorId ?? "none"}
                disabled={isPending}
                defaultValue={chat.assignedAdvisorId ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  startTransition(() => reassignConversation(chat.waId, value));
                }}
                className="max-w-[170px] appearance-none truncate bg-transparent pr-5 text-right text-[16px] outline-none [&>option]:bg-[#2c2c2e]"
              >
                <option value="">Sin asignar</option>
                {advisors.map((a) => (
                  <option key={a.id} value={a.id} disabled={!a.assignable}>
                    {a.name}
                  </option>
                ))}
              </select>
              <ChevronsUpDown className="pointer-events-none absolute right-0 size-4" />
            </span>
          </label>
        </div>

        {(canTake || chat.status !== "bot" || chat.stage !== "resuelto") && (
          <>
            <p className="ios-section-title">Acciones</p>
            <div className="ios-group">
              {canTake && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => takeConversation(chat.waId))}
                  className="ios-row w-full text-brand"
                >
                  <Hand className="size-5" /> Tomar el control
                </button>
              )}
              {chat.status !== "bot" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => returnToBot(chat.waId))}
                  className="ios-row w-full text-brand"
                >
                  <Bot className="size-5" /> Devolver al asistente IA
                </button>
              )}
              {chat.stage !== "resuelto" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => markResolved(chat.waId))}
                  className="ios-row w-full text-brand"
                >
                  <CircleCheck className="size-5" /> Marcar como resuelto
                </button>
              )}
            </div>
          </>
        )}
        <p className="px-4 pt-2 text-[13px] leading-snug text-ios-label-2">
          Mientras un asesor tenga el chat, el asistente IA no responde automáticamente.
        </p>
      </div>
    </aside>
  );
}
