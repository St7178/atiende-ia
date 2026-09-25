import type { CSSProperties } from "react";

// Marca de esta instalacion del portal: nombre, textos, logo y colores.
// Es el unico lugar donde vive la identidad de la empresa; el resto del codigo
// la toma de aqui (los colores llegan a CSS como variables en app/layout.tsx).
// Para una empresa nueva: cambia estos valores, pon su logo en public/brand/ y
// regenera el fondo de los chats con scripts/gen-wallpaper.mjs de la skill.
export const brand = {
  name: "AtiendeIA",
  shortName: "AtiendeIA",
  subtitle: "Atención por WhatsApp con IA",
  metaTitle: "AtiendeIA - Atención por WhatsApp con IA",
  metaDescription: "Conversaciones de WhatsApp atendidas por IA y asesores, en un solo portal",
  loginDescription:
    "Ingresa para gestionar las conversaciones de WhatsApp, el asistente de IA y tu equipo de asesores",
  // Como se nombra al equipo cuando no hay un asesor concreto (llamadas con IA).
  teamName: "nuestro equipo",
  logoUrl: "/brand/logo.svg",
  // Texto de credito opcional al pie del login.
  credit: "AtiendeIA · creado por Johann Steven Toro Aguirre" as string | null,
  colors: {
    brand: "#6d5dfc", // color principal (botones, acentos, burbuja del asesor)
    brand2: "#a855f7", // segundo color de los degradados del login
    onBrand: "#ffffff", // texto sobre el color principal
    brandSoft: "#f5f3ff", // fondos claros del login
    brandSoft2: "#ede9fe",
    bubbleBot: "#231f3d", // burbuja del asistente IA
    onBubbleBot: "#ebe8ff",
    bubbleOutAuthor: "#e4defe", // nombre del asesor dentro de su burbuja
    wallpaperBg: "#0a0a10", // fondo de los chats (debajo del patron de iconos)
  },
};

/** Variables CSS con los colores de la marca (se aplican en <html>). */
export function brandCssVars(): CSSProperties {
  const c = brand.colors;
  return {
    "--brand": c.brand,
    "--brand-2": c.brand2,
    "--on-brand": c.onBrand,
    "--brand-soft": c.brandSoft,
    "--brand-soft-2": c.brandSoft2,
    "--bubble-bot": c.bubbleBot,
    "--on-bubble-bot": c.onBubbleBot,
    "--bubble-out-author": c.bubbleOutAuthor,
    "--wallpaper-bg": c.wallpaperBg,
  } as CSSProperties;
}
