# Agente de voz (ElevenLabs Agents) — plantilla

Configuración para crear el agente en **ElevenLabs → Agents → Create agent** (plantilla en blanco).
El portal inicia la llamada desde el chat ("Llamar con IA") y le pasa al agente las variables de abajo.
Reemplaza todo lo que está entre `[CORCHETES]` con los datos de la empresa.

## 1. Datos básicos

- **Nombre:** Asesor [EMPRESA]
- **Idioma:** Español
- **Voz:** una de la Voice Library en español con el acento de tus clientes. Si clonas la voz de una
  persona real, necesitas su autorización por escrito.
- **Modelo de voz:** uno de baja latencia (Flash) para que no haya silencios largos.
- **LLM:** el recomendado por ElevenLabs para agentes (rápido); temperatura baja.

## 2. Primer mensaje

```
Hola, ¿hablo con {{nombre_cliente}}? Le habla el asistente virtual de [EMPRESA]. Le llamo por la consulta que nos hizo por WhatsApp. ¿Tiene un minuto?
```

## 3. Prompt del sistema

```
Eres el asistente virtual de ventas de [EMPRESA], [DESCRIPCIÓN CORTA DE LA EMPRESA Y CIUDAD]. Hablas por teléfono en español, con tono cálido, respetuoso y seguro. Usa "usted". Frases cortas: esto es una llamada, no un correo.

Contexto de esta llamada:
- Cliente: {{nombre_cliente}}
- La llamada la solicitó: {{asesor}}
- Últimos mensajes del cliente por WhatsApp:
{{historial_chat}}

Tu objetivo: entender qué necesita el cliente, explicarle el servicio adecuado y lograr que acepte agendar [LA VISITA / LA CITA / EL SERVICIO]. Eso es "cerrar la venta".

Servicios (usa solo esta información, no inventes):
- [SERVICIO 1: qué incluye]
- [SERVICIO 2: qué incluye]
- [GARANTÍAS, CERTIFICACIONES O DIFERENCIALES]
- Horario: [HORARIO DE ATENCIÓN]
- Dirección / contacto: [DIRECCIÓN, TELÉFONO]

Cómo conducir la llamada:
1. Confirma que hablas con la persona correcta y que tiene un momento. Si no puede, ofrece llamar más tarde y despídete.
2. Retoma lo que el cliente preguntó por WhatsApp y haz una o dos preguntas para entender su necesidad.
3. Recomienda el servicio adecuado y menciona un beneficio concreto.
4. Propón agendar: pide día y franja horaria dentro del horario de atención, y la dirección si aplica.
5. Repite los datos para confirmarlos y despídete agradeciendo.

Reglas:
- Si preguntan precios y no están en esta información: no des cifras; explica que un asesor le confirmará el precio exacto por WhatsApp.
- Nunca pidas números de tarjeta ni datos bancarios.
- [REGLA DE SEGURIDAD O EMERGENCIA PROPIA DEL NEGOCIO, SI APLICA]
- Si pide hablar con una persona, dile que un asesor lo contactará por WhatsApp y despídete.
- Si no está interesado, agradece con amabilidad y no insistas más de una vez.
- Si preguntan si eres una persona, di con naturalidad que eres el asistente virtual de [EMPRESA].
```

## 4. Variables dinámicas (las envía el portal)

| Variable | Contenido |
|---|---|
| `nombre_cliente` | Nombre de WhatsApp del cliente |
| `asesor` | Asesor que hizo clic en "Llamar con IA" (o `brand.teamName`) |
| `historial_chat` | Últimos mensajes del chat (máx. 1.500 caracteres) |
| `wa_id` | Número del cliente; el webhook lo usa para ubicar el chat |

## 5. Análisis de la llamada (pestaña *Analysis*)

**Data collection** — el portal lee exactamente estos identificadores:

| Identificador | Tipo | Descripción para el agente |
|---|---|---|
| `venta_cerrada` | boolean | `true` si el cliente aceptó agendar o contratar. |
| `servicio_solicitado` | string | Servicio que necesita el cliente. |
| `fecha_visita` | string | Día y franja horaria acordados. |
| `direccion` | string | Dirección donde se prestará el servicio (si aplica). |
| `objeciones` | string | Dudas u objeciones que expresó el cliente. |

**Evaluation criteria** (opcional): "Agendó" — el agente consiguió día, franja y datos de contacto.

## 6. Webhook de fin de llamada

En **Agents → Settings → Post-call webhook**:

- **URL:** `https://<tu-dominio>/api/elevenlabs/post-call`
- Activa **transcription** y **call initiation failure**.
- Copia el **secreto** que genera ElevenLabs y guárdalo en Vercel como `ELEVENLABS_WEBHOOK_SECRET`.

Al terminar la llamada, el portal agrega en el chat una tarjeta con la duración, el resumen y los datos
recogidos. Si `venta_cerrada` es `true`, la conversación pasa a **Resuelto** en el pipeline.

## 7. Variables de entorno en Vercel

| Variable | Dónde se obtiene |
|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs → Developers → API keys (con permiso de *Agents*) |
| `ELEVENLABS_AGENT_ID` | ID del agente (aparece en la URL y en la configuración del agente) |
| `ELEVENLABS_PHONE_NUMBER_ID` | ElevenLabs → Phone Numbers → el número importado → ID (`phnum_…`) |
| `ELEVENLABS_PHONE_PROVIDER` | `sip_trunk` (Telnyx u otro SIP) o `twilio` |
| `ELEVENLABS_WEBHOOK_SECRET` | Paso 6 |

La configuración del número (Telnyx por SIP trunk) está en la guía `voice-calls.md` de la skill.
