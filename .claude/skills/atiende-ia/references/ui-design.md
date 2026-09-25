# Diseño de la interfaz

Referencia visual: **WhatsApp en iPhone, modo oscuro**, con el color de la marca en lugar del verde de
WhatsApp. `<html class="dark">` siempre. Tailwind v4 (sin `tailwind.config.js`): los tokens viven en
`app/globals.css` (`.dark { … }` + `@theme inline`).

## Marca (`lib/brand.ts`)

Todo lo que identifica a la empresa está en un solo archivo: `name`, `shortName`, `subtitle`,
`metaTitle`, `metaDescription`, `loginDescription`, `teamName`, `logoUrl` (URL externa o archivo en
`public/brand/`), `credit` (texto opcional al pie del login) y `colors`. `app/layout.tsx` convierte
los colores en variables CSS sobre `<html>` (`brandCssVars()`), y el resto del código solo usa esas
variables. Para cambiar de marca no hay que tocar componentes.

| Color en `brand.colors` | Variable / clase | Uso |
|---|---|---|
| `brand` | `--brand` · `bg-brand` / `text-brand` | Acento: botones, íconos activos, badges, burbuja del asesor (`bg-bubble-out`) |
| `brand2` | `--brand-2` · `from-brand to-brand-2` | Segundo color de los degradados del login |
| `onBrand` | `--on-brand` · `text-on-brand` | Texto sobre el color de marca |
| `brandSoft`, `brandSoft2` | `bg-brand-soft`, `bg-brand-soft-2` | Fondos claros del login |
| `bubbleBot`, `onBubbleBot` | `bg-bubble-bot`, `text-on-bubble-bot` | Burbuja del asistente IA |
| `bubbleOutAuthor` | `text-bubble-out-author` | Nombre del asesor dentro de su burbuja |
| `wallpaperBg` | `--wallpaper-bg` | Fondo bajo el patrón de íconos de los chats |

Elige `onBrand` con buen contraste sobre `brand` (texto oscuro si el color es claro, blanco si es
oscuro). Si cambias `brand`, regenera el fondo de los chats con el mismo color:
`node <skill>/scripts/gen-wallpaper.mjs --color "#RRGGBB" --bg "#RRGGBB"` desde la raíz del proyecto.

## Tokens fijos (iOS)

| Token / clase | Valor | Uso |
|---|---|---|
| `bg-background` | `#000` | Fondo general |
| `bg-ios-grouped` | `#1c1c1e` | Tarjetas, listas agrupadas, buscador, chips |
| `bg-ios-elevated` | `#2c2c2e` | Hover / elementos elevados, menús |
| `text-ios-label-2` | `#8e8e93` | Texto secundario |
| `border-ios-separator` | `rgb(255 255 255 / .08)` | Separadores |
| `bg-bubble-in` | `#262628` | Burbuja del cliente |
| rojo iOS | `#ff453a` | Errores, "Cerrar sesión" |
| verde iOS | `#30d158` | Confirmaciones |

Tipografía: clase `font-ios` (San Francisco en Apple, Inter en el resto). El login usa sus fuentes
propias (Public Sans / Manrope).

## Componentes y patrones

- **Títulos grandes**: `PageHeader` (34 px en móvil, 28 px en escritorio). En móvil incluye el menú
  de cuenta arriba a la derecha.
- **Listas agrupadas tipo Ajustes**: `ios-section-title` (título en mayúsculas) + `ios-group`
  (contenedor redondeado) + `ios-row` (fila de 44 px). `ios-tile` para accesos rápidos
  (Llamar IA, Llamar, WhatsApp, Copiar).
- **Chats**:
  - Lista: avatar 52 px (degradado gris con iniciales; la API oficial de WhatsApp no da fotos de
    perfil), nombre, hora estilo WhatsApp, vista previa (ícono de bot o "Nombre:" si respondió un
    asesor), badge con el color de marca y los mensajes sin responder.
  - Filtros como chips horizontales con `ChipScroller` (arrastrar, rueda y flechas con difuminado).
  - Conversación: fondo `chat-wallpaper` (`public/chat-wallpaper.svg`), burbujas con colita en el
    primer mensaje de cada grupo, hora dentro de la burbuja, separadores de día pegajosos
    ("Hoy", "Ayer", día de la semana, fecha), llamadas como tarjeta centrada.
  - Compositor: campo redondeado con emojis y botón circular del color de marca; si el asesor no
    tiene el chat, se reemplaza por el motivo + "Tomar el control".
  - Info. del contacto: panel de 360 px a la derecha (desde `xl`), superpuesto al chat entre `md` y
    `xl`, pantalla completa en móvil.
- **Navegación**: rail de íconos de 72 px en escritorio (como WhatsApp Desktop) con tooltip;
  barra de pestañas iOS en móvil, oculta dentro de un chat. El badge muestra los chats que esperan asesor.
- **Pipeline**: 4 widgets de conteo + 4 columnas; en móvil, control segmentado iOS para elegir etapa.
- **Conocimiento**: el admin ve el editor (lista agrupada con textarea y botón "Guardar"); los asesores
  ven el mismo texto en una `ios-group` de solo lectura con un aviso con candado.
- **Login** (`components/ui/travel-connect-signin-1.tsx`): tarjeta clara con el diagrama animado
  (`AnimatedBeam`) a la izquierda y el formulario a la derecha; usa los colores de la marca.
- Los datos se actualizan solos (ver "Actualización en vivo" en `architecture.md`); ninguna pantalla
  debe necesitar recargar el navegador.
- Controles nativos (`select`, checkbox) con `appearance-none` / `accent-[var(--brand)]` y opciones con
  fondo `#2c2c2e`.

## Reglas

- Mismo aspecto en 375 px, 1100 px y 1440 px: revisa los tres tamaños al cambiar una pantalla.
- Textos de interfaz en español con tildes; mensajes de error que digan qué hacer.
- Sin datos ni botones de relleno: si una función no existe, no se muestra.
- Íconos de `lucide-react`. Nada de colores de marca escritos a mano en los componentes: usa las
  clases de la tabla de marca.
