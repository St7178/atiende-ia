// Formatos de fecha estilo WhatsApp, siempre en hora de Colombia para que el
// servidor (Vercel, en UTC) y el navegador muestren lo mismo.
const TIME_ZONE = "America/Bogota";
const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD
}

function daysAgo(date: Date, now: Date) {
  return Math.round((Date.parse(dayKey(now)) - Date.parse(dayKey(date))) / DAY_MS);
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatClock(date: Date) {
  return date.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
}

/** Hora que se muestra en la lista de chats: "3:45 p. m.", "Ayer", "Lunes" o "24/09/26". */
export function formatListTime(date: Date, now = new Date()) {
  const diff = daysAgo(date, now);
  if (diff <= 0) return formatClock(date);
  if (diff === 1) return "Ayer";
  if (diff < 7) return capitalize(date.toLocaleDateString("es-CO", { weekday: "long", timeZone: TIME_ZONE }));
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: TIME_ZONE });
}

/** Separador de dia dentro del chat: "Hoy", "Ayer", "Lunes" o "24 de septiembre de 2026". */
export function formatDayLabel(date: Date, now = new Date()) {
  const diff = daysAgo(date, now);
  if (diff <= 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return capitalize(date.toLocaleDateString("es-CO", { weekday: "long", timeZone: TIME_ZONE }));
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });
}

export function formatPhone(waId: string) {
  // Numeros de Colombia: 57 + 10 digitos -> +57 319 570 5024
  const m = waId.match(/^57(\d{3})(\d{3})(\d{4})$/);
  return m ? `+57 ${m[1]} ${m[2]} ${m[3]}` : `+${waId}`;
}
