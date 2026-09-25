"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Fila horizontal de chips que se puede deslizar con el dedo, arrastrar con el
// mouse, mover con la rueda o con las flechas que aparecen en los bordes.
export function ChipScroller({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft > 2, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);

    // La rueda vertical del mouse desplaza la fila en horizontal.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      updateEdges();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [updateEdges]);

  function scrollByPage(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
    setTimeout(updateEdges, 400);
  }

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        ref={ref}
        onScroll={updateEdges}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !ref.current) return;
          drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !ref.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) d.moved = true;
          ref.current.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => {
          // Deja que el click se procese antes de soltar el estado de arrastre.
          setTimeout(() => (drag.current = null), 0);
        }}
        onPointerLeave={() => (drag.current = null)}
        onClickCapture={(e) => {
          // Si se arrastro, no activar el chip bajo el cursor.
          if (drag.current?.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="no-scrollbar flex gap-2 overflow-x-auto scroll-px-4 px-4 select-none"
      >
        {children}
      </div>

      {edges.start && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center bg-gradient-to-r from-background via-background/80 to-transparent">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Ver filtros anteriores"
            className="pointer-events-auto ml-1 hidden size-7 place-items-center rounded-full bg-ios-elevated text-white shadow md:grid"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
      )}
      {edges.end && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-background via-background/80 to-transparent">
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Ver más filtros"
            className="pointer-events-auto mr-1 hidden size-7 place-items-center rounded-full bg-ios-elevated text-white shadow md:grid"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
