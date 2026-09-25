# Llamadas con agente de voz (ElevenLabs + telefonía SIP)

## Flujo

1. En el chat, el asesor toca el teléfono → **"Llamar con IA"** (o "Llamar IA" en Info. del contacto)
   y confirma.
2. `startAiCall(waId)` (server action) llama a ElevenLabs con `lib/elevenlabs.ts`:
   - `ELEVENLABS_PHONE_PROVIDER=sip_trunk` (por defecto) → `POST /v1/convai/sip-trunk/outbound-call`
   - `twilio` → `POST /v1/convai/twilio/outbound-call`
   - Body: `agent_id`, `agent_phone_number_id`, `to_number` (`+<wa_id>`) y
     `conversation_initiation_client_data.dynamic_variables` = `wa_id`, `nombre_cliente`, `asesor`,
     `historial_chat` (últimos mensajes, máx. 1.500 caracteres). Si no hay asesor se usa
     `brand.teamName`.
3. El portal guarda un mensaje `sender = 'llamada'` ("Llamada con IA iniciada por …") que se ve como
   tarjeta centrada en el chat.
4. Al colgar, ElevenLabs llama a `POST /api/elevenlabs/post-call`:
   - Verifica `elevenlabs-signature` (`t=<ts>,v0=<hmac>`; HMAC-SHA256 hex de `"<ts>.<cuerpo>"` con
     `ELEVENLABS_WEBHOOK_SECRET`; ventana de 30 min; acepta varias `v0` durante una rotación).
   - `post_call_transcription` → tarjeta con duración, resumen y los campos de *data collection*
     (`venta_cerrada`, `servicio_solicitado`, `fecha_visita`, `direccion`, `objeciones`). Si
     `venta_cerrada = true`, el chat pasa a **Resuelto**.
   - `call_initiation_failure` → tarjeta "no conectada" (ocupado / no contestó).
   - Usa `wa_id` de las variables dinámicas para ubicar el chat y `wamid = elevenlabs:<id>:fin` para no
     duplicar.

## Configuración

| Pieza | Dónde |
|---|---|
| Agente | ElevenLabs → Agents, con `elevenlabs/agente-ventas.md` (prompt, primer mensaje, variables, análisis). **Publicarlo** después de cada cambio: las llamadas por API usan la versión publicada |
| Número | Importado en ElevenLabs → Phone Numbers (SIP trunk o Twilio); su ID `phnum_…` va en `ELEVENLABS_PHONE_NUMBER_ID` |
| Webhook de fin de llamada | `https://<tu-dominio>/api/elevenlabs/post-call` con *transcripción* y *fallo al iniciar* activados |
| Vercel | `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET` (secretos), `ELEVENLABS_AGENT_ID`, `ELEVENLABS_PHONE_NUMBER_ID`, `ELEVENLABS_PHONE_PROVIDER` |

## Telnyx (SIP trunk, recomendado)

1. Cuenta con saldo y **verificada** (sin *upgrade* no permite destinos internacionales).
2. Voice → SIP Trunking → conexión tipo **FQDN**: en *FQDNs* agregar `sip.rtc.elevenlabs.io:5060`
   (TCP). El campo *SIP subdomain* es un nombre propio (ej. `mi-portal-pruebas`), no la dirección de
   ElevenLabs.
3. *Outbound calls authentication* → **Credentials** (usuario y contraseña).
4. **Outbound Voice Profile** con la conexión asignada y los países de destino en *Whitelisted
   Destinations*.
5. Número con voz asignado a la conexión.
6. ElevenLabs → Phone Numbers → Import → **SIP trunk**: número en formato E.164, dirección
   `sip.telnyx.com`, transporte TCP, usuario/contraseña del paso 3. Asignar el agente.

## Lecciones aprendidas

- **Twilio en cuenta de prueba no sirve**: bloquea el `<Stream>` y los parámetros que usa ElevenLabs
  ("trial accounts have limited parameter access"). El portal traduce ese error a un mensaje claro.
- Todos los proveedores exigen cuenta verificada y saldo para llamar a otros países; no hay opción
  gratis para llamadas reales. Para afinar voz y guion sin costo: "Probar agente" en ElevenLabs.
- **Llamadas por WhatsApp** (en vez de telefonía) son posibles con la integración de WhatsApp de
  ElevenLabs, pero exigen que el número tenga límite de 2.000 destinatarios/día, plantilla de permiso
  de llamada aceptada por el cliente (1 solicitud/día, 2/semana) y que el número no esté gestionado
  por otra app (aquí lo usa n8n).
- El agente no inventa precios ni pide datos de tarjeta: "cerrar la venta" = el cliente acepta
  agendar la visita o el servicio. Debe presentarse como asistente virtual.
