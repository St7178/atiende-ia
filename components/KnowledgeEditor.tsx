"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveKnowledge } from "@/app/(dashboard)/conocimiento/actions";

export function KnowledgeEditor({ initialText }: { initialText: string }) {
  const [value, setValue] = useState(initialText);
  const [saved, setSaved] = useState(initialText);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty = value !== saved;

  return (
    <div className="flex flex-col">
      <div className="ios-group">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={20}
          className="block min-h-[50vh] w-full resize-y bg-transparent p-4 text-[15px] leading-relaxed outline-none placeholder:text-ios-label-2"
          placeholder="Escribe aquí la información de la empresa: horarios, procesos, políticas, preguntas frecuentes..."
        />
      </div>
      <div className="flex items-center gap-3 px-1 pt-3">
        <span className={`flex-1 text-[13px] ${error ? "text-[#ff453a]" : "text-ios-label-2"}`}>
          {error ??
            (dirty ? "Cambios sin guardar" : savedAt ? `Guardado a las ${savedAt}` : `${value.length} caracteres`)}
        </span>
        <button
          type="button"
          disabled={isPending || !dirty}
          onClick={() =>
            startTransition(async () => {
              const result = await saveKnowledge(value);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setError(null);
              setSaved(value);
              setSavedAt(new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }));
            })
          }
          className="flex h-9 items-center gap-1.5 rounded-full bg-brand px-5 text-[15px] font-semibold text-on-brand transition-opacity disabled:opacity-40"
        >
          <Check className="size-4" strokeWidth={2.6} /> {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
      <p className="px-1 pt-3 text-[13px] leading-snug text-ios-label-2">
        El asistente de WhatsApp lee este texto para responder. Los cambios se aplican desde el siguiente mensaje que
        llegue. Si una pregunta no está cubierta aquí, la IA pasa el chat a un asesor.
      </p>
    </div>
  );
}
