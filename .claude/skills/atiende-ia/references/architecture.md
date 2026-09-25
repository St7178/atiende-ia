# Arquitectura y modelo de datos

## Tablas (Postgres en Neon, `prisma/schema.prisma`)

| Tabla | Campos clave | Escriben |
|---|---|---|
| `advisors` | `name`, `username` (único), `password_hash` (scrypt), `email` (Google, único, opcional), `role` (`admin`/`asesor`), `is_active`, `avatar_color` | Portal |
| `conversations` | `wa_id` (PK, número 57…), `contact_name`, `status`, `pipeline_stage`, `assigned_advisor_id`, `last_message_at` | n8n 01, n8n 02, portal |
| `messages` | `wa_id`, `wamid`, `sender`, `advisor_id`, `body`, `created_at` | n8n 01 (cliente, bot), n8n 02 (asesor), portal (llamada) |
| `company_knowledge` | `knowledge_text`, `updated_at` | Portal (página Conocimiento); n8n 01 la lee |

`messages.sender`: `cliente` | `bot` | `asesor` | `llamada`. Las llamadas usan
`wamid = "elevenlabs:<conversation_id>:inicio|fin"`; el sufijo `:fin` sirve para no duplicar el
resultado si ElevenLabs reintenta el webhook.

## Estados de una conversación

Hay dos columnas que se mueven juntas: `status` (lo usa n8n para decidir si la IA responde) y
`pipeline_stage` (columnas del Pipeline en el portal).

| Situación | `status` | `pipeline_stage` | Quién lo pone |
|---|---|---|---|
| Chat nuevo o la IA lo atiende | `bot` | `nuevo` | n8n 01 (insert) / portal "Devolver al asistente IA" |
| La IA no sabe o el cliente pide persona | `pendiente_humano` | `esperando_asesor` | n8n 01 ("Marcar pendiente de asesor") / portal al quitar la asignación |
| Un asesor lo tomó o respondió | `human` | `en_atencion` | Portal (tomar/asignar/enviar) y n8n 02 |
| Resuelto | `resuelto` | `resuelto` | Portal "Marcar como resuelto" / webhook de llamada con `venta_cerrada = true` |

Reglas importantes:
- **La IA solo responde si `status = 'bot'`.** Con cualquier otro estado, el flujo 01 guarda el
  mensaje y se detiene en el IF "Conversacion en manos del bot" (su rama *false* no tiene nodos). Si
  alguien reporta que "el bot se frena en *Obtener base de conocimiento*", casi siempre es esto: el
  chat está en `pendiente_humano`/`human` y nadie lo atiende. Solución en el portal: "Devolver al
  asistente IA".
- **Un chat resuelto se reabre solo:** el upsert del flujo 01 lo devuelve a `bot`/`nuevo` y lo
  desasigna cuando el cliente vuelve a escribir.
- Mientras un asesor tiene el chat, la IA no responde.

## Portal (Next.js 16, App Router)

- Todas las pantallas del dashboard son server components con `dynamic = "force-dynamic"`.
- **Actualización en vivo** (`components/LiveUpdates.tsx`, montado una vez en el layout): cada 2,5 s
  consulta `GET /api/updates`, que devuelve una "versión" barata de los datos
  (`max(messages.id)` + md5 de `wa_id|status|pipeline_stage|assigned_advisor_id` de todas las
  conversaciones, ~90 ms). Solo si la versión cambió hace `router.refresh()`, nunca dos a la vez, y se
  pausa con la pestaña en segundo plano (revisa al volver). No uses `setInterval` + `router.refresh()`
  a ciegas: cada recarga renderiza todo contra Neon y, si tarda más que el intervalo, la siguiente
  cancela la anterior y la pantalla nunca se actualiza (fue el bug "tengo que recargar la página").
  Si agregas datos que deban verse en vivo y no cambian esa versión, inclúyelos en la consulta.
- Las mutaciones son **server actions**:
  - `app/(dashboard)/conversaciones/actions.ts`: `reassignConversation`, `takeConversation`,
    `sendMessage` (llama al webhook del flujo 02), `markResolved`, `returnToBot`, `startAiCall`.
  - `app/(dashboard)/asesores/actions.ts`: `createAdvisor`, `updateAdvisor` (solo admin).
  - `app/(dashboard)/conocimiento/actions.ts`: `saveKnowledge` (solo admin; los asesores ven el
    texto en modo lectura).
- `lib/chat-data.ts` → `loadChatList()`: arma la lista de chats con vista previa, hora estilo
  WhatsApp y `unanswered` = mensajes del cliente al final del chat sin respuesta (el número con el color de la marca).
  `countWaitingChats()` alimenta el badge de la navegación.
- Las acciones que fallan de forma esperable devuelven `{ ok: false, error }` con un mensaje en
  español para mostrar en la interfaz, en vez de lanzar excepciones (en producción Next oculta el
  texto de las excepciones).

## Integraciones externas

| Servicio | Para qué | Configuración |
|---|---|---|
| Meta WhatsApp Cloud API | Recibir/enviar mensajes | En n8n (credencial "WhatsApp account" y el *phone number id* del número) |
| n8n | Bot con IA (flujo 01) y envío de mensajes del asesor (flujo 02) | `references/n8n-workflows.md` |
| OpenAI (vía n8n) | Respuestas de la IA (`gpt-4o-mini`, temperatura 0.3) | Nodo "OpenAI Chat Model" del flujo 01 |
| ElevenLabs Agents | Llamadas con agente de voz | `references/voice-calls.md` |
| Telnyx (SIP trunk) | Telefonía de las llamadas | `references/voice-calls.md` |
| Google OAuth | Login con Google | `references/auth.md` |
