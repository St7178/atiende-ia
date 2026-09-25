---
name: atiende-ia
description: 'AtiendeIA: plantilla completa y estándares para crear y mantener un CRM de WhatsApp con IA para cualquier empresa (Next.js 16 + Prisma/Postgres + n8n + OpenAI + ElevenLabs, desplegado en Vercel), con el código fuente incluido. Úsala SIEMPRE que el usuario quiera montar un portal o CRM de WhatsApp con bot de IA y asesores, crear "AtiendeIA" o un portal parecido para su empresa, o trabajar en un proyecto creado con esta plantilla, aunque no nombre la skill, por ejemplo: personalizar la marca (nombre, logo, colores), cambiar pantallas (chats, pipeline, asesores, conocimiento, login), configurar o arreglar los flujos de n8n del bot ("no responde", "n8n respondió 401/500"), asesores, roles, login con Google, llamadas con agente de voz (ElevenLabs, Telnyx), variables de Vercel, migraciones de Prisma o desplegar.'
---

# AtiendeIA

**Autor:** Johann Steven Toro Aguirre

CRM de WhatsApp con IA para empresas de servicios. Los clientes escriben al WhatsApp de la empresa →
un **bot con IA en n8n** responde usando la base de conocimiento → si no sabe, **deriva a un asesor**
→ los asesores atienden desde el **portal** (estilo WhatsApp iOS, modo oscuro, con el color de la
marca) y pueden hacer **llamadas con un agente de voz de ElevenLabs**.

El archivo `.skill` distribuible trae el **código completo** en `assets/source/`. Para empezar un
proyecto nuevo, copia ese código (no lo reescribas) y sigue `references/recreate-from-scratch.md`.
Dentro del repositorio de AtiendeIA el código es el propio repo; para generar el `.skill` con la
última versión: `python .claude/skills/atiende-ia/scripts/package_skill.py <carpeta_salida>`.

- Idioma: todo lo que ve el usuario va en **español**, con tildes. El código y los comentarios en
  español sin tildes, como el resto del código.
- Marca por defecto: "AtiendeIA" (violeta). Cada empresa pone la suya en `lib/brand.ts`.

## Cómo encaja todo

```
Cliente WhatsApp ──► Meta Cloud API ──► n8n flujo 01 (webhook wa-webhook-inbound)
                                          │ guarda cliente/mensaje en Postgres
                                          │ status = 'bot'? → IA (OpenAI) responde y guarda
                                          └ si la IA no sabe → [DERIVAR_HUMANO] → 'pendiente_humano'
Portal (Next.js en Vercel) ◄──── lee/escribe Postgres con Prisma
  asesor escribe ──► n8n flujo 02 (webhook portal-send-message, header x-portal-token)
                        └ envía por WhatsApp y guarda el mensaje como 'asesor'
  "Llamar con IA" ──► ElevenLabs Agents (SIP trunk) ──► llamada al celular
                        └ al colgar: webhook /api/elevenlabs/post-call → tarjeta en el chat
```

El detalle (estados de una conversación, quién escribe qué tabla) está en
`references/architecture.md`. Léelo antes de tocar lógica de estados o de n8n.

## Mapa del código

| Ruta | Qué es |
|---|---|
| `lib/brand.ts` | **Marca**: nombre, textos, logo, colores y crédito. Único lugar con la identidad de la empresa |
| `app/(dashboard)/` | Pantallas con sesión: `conversaciones`, `pipeline`, `asesores` (solo admin), `conocimiento` + sus server actions |
| `app/login/` | Login (usuario/contraseña o Google) y sus actions |
| `app/api/auth/*` | Google OAuth y cierre de sesión forzado |
| `app/api/updates` | "Versión" de los datos para la actualización en vivo |
| `app/api/elevenlabs/post-call` | Webhook de fin de llamada (firma HMAC) |
| `components/chat/` | `ChatList`, `ChatScreen` (burbujas, info del contacto, llamadas), `ChipScroller` |
| `components/shell/` | Navegación (rail en escritorio, tabs iOS en móvil), `PageHeader`, `AccountMenu`, contexto |
| `components/ui/` | Base shadcn adaptada a Tailwind v4 (dropdown, tooltip) y el login con `AnimatedBeam` |
| `lib/` | `auth` (sesión), `currentAdvisor`, `password` (scrypt), `google-auth`, `chat-data`, `chat-format`, `elevenlabs`, `n8n`, `prisma` |
| `proxy.ts` | Middleware de Next 16: exige sesión salvo `/login`, `/api/auth/*`, `/api/elevenlabs/*` |
| `prisma/` | `schema.prisma` + migraciones (fuente de verdad del esquema) |
| `n8n/` | Flujos 01 y 02 + `schema.sql` de referencia |
| `elevenlabs/agente-ventas.md` | Plantilla del agente de voz (adaptarla a la empresa) |
| `public/brand/logo.svg`, `public/chat-wallpaper.svg` | Logo y fondo de los chats (`scripts/gen-wallpaper.mjs`) |

## Estándares

**Interfaz**
- Diseño estilo **WhatsApp en iOS, modo oscuro**, con el color de la marca donde WhatsApp usa verde.
  La marca vive en `lib/brand.ts`: nunca escribas el nombre de la empresa ni colores de marca en los
  componentes. Usa los tokens y clases de `app/globals.css` (`bg-brand`, `text-on-brand`,
  `bg-ios-grouped`, `text-ios-label-2`, `ios-group`, `ios-row`, `bg-bubble-out`, `chat-wallpaper`…).
  Guía completa en `references/ui-design.md`.
- Todo debe funcionar en **móvil** (375 px) y escritorio. En móvil los chats son de una vista a la vez
  (lista → chat → info); la barra de pestañas se oculta dentro de un chat.
- Solo se muestra información real: nada de datos de ejemplo, contadores inventados ni botones que no
  hacen nada.
- Fechas y horas se formatean **en el servidor** (`lib/chat-format.ts`, zona `America/Bogota`;
  cámbiala si la empresa está en otro país) para que no cambien al hidratar.
- Los datos se actualizan **en vivo** sin recargar: `LiveUpdates` consulta `/api/updates` y refresca
  solo cuando algo cambió (detalles en `references/architecture.md`).

**Datos**
- El esquema se cambia con **migraciones de Prisma** en `prisma/migrations/`. Si la base ya tiene
  datos reales, escribe migraciones **aditivas** y aplícalas con `npx prisma migrate deploy`; nunca
  `migrate reset` ni `db push --force-reset`. Luego `npx prisma generate` (en Windows detén el
  `next dev` antes: bloquea el motor de Prisma y falla con `EPERM`).
- n8n escribe en las mismas tablas: si renombras columnas o cambias valores de `status`,
  `pipeline_stage` o `sender`, actualiza también los flujos de `n8n/`.
- Para borrar o corregir datos reales, primero lístalos (solo lectura), confirma con el usuario y
  hazlo en una transacción.

**Sesión y permisos** (`references/auth.md`)
- Cada acción usa el asesor de la sesión (`getCurrentAdvisor()`).
- Lo exclusivo del administrador se valida en el **servidor** además de ocultarse en la interfaz
  (página Asesores, editar la base de conocimiento, asignar chats a un admin).

**Secretos**
- Nunca escribas secretos en el código ni en los flujos exportados: usa marcadores como
  `PEGA_AQUI_...`. Si el usuario pega una clave en el chat, recomiéndale rotarla y que la pegue él
  directamente en Vercel/ElevenLabs/Telnyx. Los IDs no secretos (agent ID, `phnum_…`, Client ID de
  Google) sí se pueden configurar con `vercel env add`.

**Calidad**
- Antes de commitear: `npx tsc --noEmit -p .` y `npx next build`. Mensajes de commit en español.

## Tareas frecuentes → dónde mirar

| Tarea | Lee |
|---|---|
| Crear el portal para una empresa nueva | `references/recreate-from-scratch.md` |
| Cambiar marca, pantallas o estilos | `references/ui-design.md` |
| El bot no responde / error en un nodo de n8n / importar flujos | `references/n8n-workflows.md` |
| Asesores, roles, login, Google | `references/auth.md` |
| Llamadas con IA, ElevenLabs, Telnyx/Twilio | `references/voice-calls.md` |
| Variables de entorno, deploy, migraciones, problemas comunes | `references/deploy-ops.md` |
| Tablas, estados y quién escribe qué | `references/architecture.md` |

## Recursos incluidos

- `assets/source/`: **código completo** del portal, listo para copiar (`npm ci` →
  `npx prisma generate` → `npx next build` compila sin cambios).
- `assets/n8n/01-whatsapp-bot-inbound.json` y `02-portal-outbound-asesor.json`: flujos listos para
  importar, con marcadores `PEGA_AQUI_...` en lugar de secretos y del *phone number id*.
  `assets/n8n/schema.sql`: esquema final de referencia.
- `assets/elevenlabs/agente-ventas.md`: plantilla del agente de voz (prompt, primer mensaje,
  variables y análisis).
- `assets/env.example`: todas las variables de entorno con explicación.
- `scripts/gen-wallpaper.mjs`: regenera `public/chat-wallpaper.svg` con el color de la marca
  (`node <skill>/scripts/gen-wallpaper.mjs --color "#RRGGBB" --bg "#RRGGBB"` desde la raíz del proyecto).

© Johann Steven Toro Aguirre.
