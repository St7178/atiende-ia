// Genera public/chat-wallpaper.svg: patron de iconos (Lucide, ISC) estilo fondo de WhatsApp.
// Ejecutar desde la raiz del proyecto (usa node_modules/lucide-react):
//   node <skill>/scripts/gen-wallpaper.mjs [--preset servicio|general] [--color "#RRGGBB"] [--bg "#RRGGBB"] [--out ruta]
// --color debe ser el color de la marca (brand.colors.brand) y --bg el fondo (brand.colors.wallpaperBg).
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PRESETS = {
  // Servicio tecnico a domicilio (hogar, herramientas, visitas)
  servicio: ["flame", "wrench", "message-circle", "house", "zap", "gauge", "phone", "calendar", "map-pin", "clock",
    "lightbulb", "thermometer", "shield-check", "hammer", "face-slightly-smiling", "bell", "message-square", "star", "heart", "settings",
    "cooking-pot", "droplet", "truck", "hard-hat", "key-round"],
  // Atencion al cliente en general
  general: ["message-circle", "phone", "calendar", "star", "heart", "bell", "face-slightly-smiling", "send", "sparkles", "bot",
    "headset", "clock", "map-pin", "shopping-bag", "check-check", "paperclip", "mail", "thumbs-up", "gift", "zap",
    "globe", "camera", "coffee", "briefcase", "message-square"],
};

const preset = arg("preset", "general");
const names = PRESETS[preset];
if (!names) throw new Error(`Preset desconocido: ${preset} (usa ${Object.keys(PRESETS).join(" o ")})`);
const color = arg("color", "#6d5dfc");
const bg = arg("bg", "#0a0a10");
const out = arg("out", "public/chat-wallpaper.svg");

const dir = "node_modules/lucide-react/dist/esm/icons/";
const cache = {};
for (const n of names) cache[n] = (await import(pathToFileURL(resolve(dir + n + ".mjs")).href)).__iconData.node;

function nodes(name) {
  return cache[name]
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
}

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const TILE = 320, GRID = 5, CELL = TILE / GRID;
let body = "";
let i = 0;
for (let gy = 0; gy < GRID; gy++)
  for (let gx = 0; gx < GRID; gx++) {
    const name = names[(i++ * 7) % names.length];
    const s = 0.95 + rnd() * 0.35;
    const x = gx * CELL + 10 + rnd() * (CELL - 24 * s - 16);
    const y = gy * CELL + 10 + rnd() * (CELL - 24 * s - 16);
    const r = Math.round(rnd() * 60 - 30);
    const warm = rnd() > 0.35;
    body += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r} ${12 * s} ${12 * s}) scale(${s.toFixed(2)})" stroke="${warm ? color : "#ffffff"}" stroke-opacity="${warm ? 0.085 : 0.045}">${nodes(name)}</g>`;
  }

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><!-- Iconos: Lucide (ISC) --><rect width="${TILE}" height="${TILE}" fill="${bg}"/>${body}</svg>`;
writeFileSync(out, svg);
console.log("ok", out, svg.length, "bytes");
