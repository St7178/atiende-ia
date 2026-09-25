"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

const POLL_MS = 2500;

// Actualizacion "en vivo" del portal: consulta /api/updates cada pocos segundos
// y recarga los datos de la pantalla solo cuando algo cambio. Nunca lanza dos
// recargas a la vez y se pausa mientras la pestaña esta en segundo plano.
export function LiveUpdates() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const lastVersion = useRef<string | null>(null);
  const refreshing = useRef(false);

  refreshing.current = isRefreshing;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    async function check() {
      if (stopped) return;
      if (document.visibilityState === "visible" && !refreshing.current) {
        try {
          const res = await fetch("/api/updates", { cache: "no-store" });
          const data = res.ok && res.headers.get("content-type")?.includes("json") ? await res.json() : null;
          const version: string | undefined = data?.version;
          if (version) {
            if (lastVersion.current !== null && version !== lastVersion.current) {
              startTransition(() => router.refresh());
            }
            lastVersion.current = version;
          }
        } catch {
          // Sin conexion momentanea: se reintenta en el siguiente ciclo.
        }
      }
      if (!stopped) timer = setTimeout(check, POLL_MS);
    }

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      check();
    }

    check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router]);

  return null;
}
