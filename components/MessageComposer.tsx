"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowUp, Hand, Smile } from "lucide-react";
import { sendMessage, takeConversation } from "@/app/(dashboard)/conversaciones/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const QUICK_EMOJIS = ["😊", "👍", "🙏", "👋", "✅", "🔥", "🛠️", "📅", "📍", "⏰", "💬", "🙌"];

export function MessageComposer({
  waId,
  canSend,
  lockedReason,
}: {
  waId: string;
  // Solo se escribe cuando la conversacion esta asignada al asesor actual.
  canSend: boolean;
  lockedReason: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function autosize() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }

  function submit() {
    const text = value.trim();
    if (!text || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await sendMessage(waId, text);
        if (result.ok) {
          setValue("");
          requestAnimationFrame(autosize);
        } else {
          setError(result.error);
        }
      } catch {
        setError("No se pudo enviar el mensaje. Intenta de nuevo.");
      }
      inputRef.current?.focus();
    });
  }

  function insertEmoji(emoji: string) {
    setValue((v) => v + emoji);
    inputRef.current?.focus();
  }

  const bar = "shrink-0 border-t border-ios-separator bg-[#161617]/90 px-2.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl";

  if (!canSend) {
    return (
      <div className={`${bar} flex items-center gap-3`}>
        <span className="min-w-0 flex-1 pl-1.5 text-[13.5px] leading-snug text-ios-label-2">{lockedReason}</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await takeConversation(waId);
            })
          }
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[15px] font-semibold text-on-brand transition-opacity disabled:opacity-60"
        >
          <Hand className="size-4" /> {isPending ? "Tomando..." : "Tomar el control"}
        </button>
      </div>
    );
  }

  return (
    <div className={bar}>
      {error && <p className="px-2 pb-2 text-[13px] text-[#ff453a]">{error}</p>}
      <div className="flex items-end gap-2">
        <div className="flex min-h-10 flex-1 items-end rounded-[20px] border border-white/[0.08] bg-ios-grouped pl-1 pr-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Emojis"
              className="grid size-10 shrink-0 place-items-center text-ios-label-2 outline-none hover:text-white"
            >
              <Smile className="size-[22px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="grid w-60 grid-cols-6 gap-1 rounded-xl p-2">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="rounded-lg p-1 text-[22px] hover:bg-white/[0.08]"
                >
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autosize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Mensaje"
            rows={1}
            className="max-h-36 min-w-0 flex-1 resize-none bg-transparent py-[9px] text-[16px] leading-[22px] outline-none placeholder:text-ios-label-2"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !value.trim()}
          aria-label="Enviar"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-on-brand transition-[opacity,transform] active:scale-95 disabled:opacity-40"
        >
          <ArrowUp className="size-[22px]" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
