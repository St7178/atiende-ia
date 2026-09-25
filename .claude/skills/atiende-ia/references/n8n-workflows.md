# Flujos de n8n

Archivos: `n8n/01-whatsapp-bot-inbound.json` y `n8n/02-portal-outbound-asesor.json` (copias en
`assets/n8n/`). Los dos usan las credenciales **"Postgres account"** (la base de Neon) y
**"WhatsApp account"** (Cloud API). Al importarlos, reasigna las credenciales en cada nodo.

## Flujo 01 — WhatsApp entrante (IA + derivación)

Webhook de Meta: `https://<tu-n8n>/webhook/wa-webhook-inbound` (se configura en Meta → WhatsApp →
Configuration → Webhook, suscrito a `messages`).

1. **Webhook (GET) → If → Respond to Webhook**: verificación de Meta. Compara `hub.verify_token` con
   el token que pusiste en Meta (en el archivo está como `PEGA_AQUI_TU_VERIFY_TOKEN_DE_META`) y
   responde `hub.challenge`; si no coincide, 403.
2. **Webhook1 (POST) → Normalizar mensaje**: extrae `wa_id`, `contact_name`, `wamid`, `message_text`.
   Si el evento no trae mensaje (estados de entrega, etc.) devuelve `[]` y el flujo termina.
3. **Es mensaje valido**: solo continúa con texto no vacío (texto o botón).
4. **Obtener o crear conversacion**: upsert en `conversations`. Si estaba `resuelto`, la reabre a
   `bot`/`nuevo` y la desasigna.
5. **Guardar mensaje del cliente** (`sender = 'cliente'`).
6. **Conversacion en manos del bot**: IF `status == 'bot'`. Rama *false* vacía: si un asesor tiene
   el chat, la IA no responde.
7. **Obtener base de conocimiento** → **Generar respuesta IA** (OpenAI `gpt-4o-mini`, temp 0.3). El
   prompt obliga a usar solo la base de conocimiento y a terminar con `[DERIVAR_HUMANO]` cuando no
   sabe o piden una persona.
8. **Detectar si requiere humano**: limpia la marca y crea `needs_human`.
9. **Requiere asesor humano**:
   - Sí → **Marcar pendiente de asesor** (`pendiente_humano`/`esperando_asesor`) → **Avisar transicion
     a humano** (mensaje fijo al cliente; no se guarda en `messages`).
   - No → **Enviar respuesta IA por WhatsApp** → **Guardar respuesta IA** (`sender = 'bot'`).

## Flujo 02 — Mensaje del asesor desde el portal

Webhook: `POST https://<tu-n8n>/webhook/portal-send-message` (esta URL de **producción** va en
`N8N_PORTAL_SEND_WEBHOOK_URL`; la de `/webhook-test/` solo funciona con el editor escuchando).

Body que envía el portal (`lib/n8n.ts`): `{ wa_id, advisor_id, message }` + header `x-portal-token`.

1. **Validar token del portal**: compara `x-portal-token` con un valor **literal** (en el archivo:
   `PEGA_AQUI_EL_PORTAL_WEBHOOK_SECRET`). Debe ser idéntico a `PORTAL_WEBHOOK_SECRET` de Vercel. Si no
   coincide → **Responder no autorizado** (401).
2. **Enviar mensaje por WhatsApp** (`phoneNumberId` = el *phone number id* de tu número).
3. **Guardar mensaje del asesor**: una sola sentencia (CTE) que inserta el mensaje `asesor` y pone la
   conversación en `human`/`en_atencion` asignada al asesor.
4. **Responder OK** → `{ ok: true }`.

## Errores ya resueltos (y cómo reconocerlos)

| Síntoma | Causa | Arreglo |
|---|---|---|
| El bot no contesta; el flujo "se frena" antes de la IA | La conversación no está en `status = 'bot'` | "Devolver al asistente IA" en el portal |
| Portal: `n8n respondio 401 (token del portal invalido)` | En el IF quedó el texto `PORTAL_WEBHOOK_SECRET` en vez del valor, o no coincide con Vercel | Pegar el valor exacto; si nadie lo sabe, generar uno nuevo y ponerlo en ambos lados |
| `$env.X` vacío en n8n Cloud | n8n Cloud bloquea `$env` en los nodos | Usar valores literales o credenciales |
| Portal: `n8n respondio 500`, pero el cliente sí recibió el mensaje | En "Guardar mensaje del asesor" se usaba `$json.body…`, y `$json` ahí es la respuesta de Meta | Leer del webhook: `$('Webhook - Portal envia mensaje').first().json.body…` |
| "Query Parameters must be a string of comma-separated values or an array" | El campo quedó en modo *Fixed*, o `.item` perdió el enlace de ítems tras el nodo de WhatsApp | Modo *Expression* y `.first()` en vez de `.item` |
| Error de Postgres con dos sentencias parametrizadas | Postgres no acepta varias sentencias con `$1…` en una consulta preparada | Unirlas con un CTE (`with … insert …) update …`) |
| El envío a WhatsApp falla por el número | `phoneNumberId` apuntaba al *business account id* | Usar el *phone number id* (Meta → WhatsApp → API Setup), no el de la cuenta de negocio |
| Probar con "Test step" en el nodo falla | En el editor el webhook no tiene datos | Probar enviando desde el portal |

## Buenas prácticas al editar los flujos

- Referencia nodos anteriores por nombre (`$('Normalizar mensaje').item.json…`); `$json` es solo la
  salida del nodo inmediatamente anterior.
- Después de un nodo de WhatsApp o HTTP, usa `.first()` para leer nodos previos.
- Exporta el flujo actualizado a `n8n/` (y a `assets/n8n/` de la skill) sustituyendo tokens por
  marcadores `PEGA_AQUI_...` antes de commitear.
