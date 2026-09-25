# AtiendeIA — CRM de WhatsApp con IA

**Autor:** Johann Steven Toro Aguirre

Portal para que una empresa atienda sus conversaciones de WhatsApp Business con un asistente de IA
y un equipo de asesores:

- **Bot con IA** (n8n + OpenAI) que responde con la base de conocimiento de la empresa y pasa el chat
  a un asesor cuando no sabe la respuesta.
- **Portal estilo WhatsApp** (iOS, modo oscuro) con chats en vivo, pipeline, asesores y base de
  conocimiento.
- **Asesores con usuario propio**, roles (administrador / asesor) e inicio de sesión con Google.
- **Llamadas con agente de voz** (ElevenLabs + telefonía SIP) que se registran en el chat.

## Tecnología

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Prisma + Postgres (Neon) · n8n ·
WhatsApp Cloud API · OpenAI · ElevenLabs Agents · Vercel.

## Estructura

```
app/               Pantallas (App Router), server actions y rutas de API
components/        Chats, navegacion, login y piezas de interfaz
lib/brand.ts       Marca: nombre, textos, logo y colores (personalizalo primero)
lib/               Sesion, permisos, datos de chats, integraciones
prisma/            Esquema y migraciones
n8n/               Flujos a importar en n8n (bot entrante y envio del asesor) + schema.sql
elevenlabs/        Plantilla del agente de voz
public/brand/      Logo
```

## Puesta en marcha

1. `npm install`
2. Personaliza `lib/brand.ts` (nombre, logo en `public/brand/`, colores).
3. Crea una base Postgres (Neon) y copia `.env.example` a `.env.local` con `DATABASE_URL`.
4. `npx prisma migrate deploy`
5. `npm run dev` y abre http://localhost:3000

Para producción: despliega en Vercel con las variables de `.env.example`, importa los flujos de
`n8n/` en tu instancia de n8n y conecta el webhook de WhatsApp en Meta. El paso a paso completo está
en la skill **atiende-ia** (`references/recreate-from-scratch.md`).

## Autoría

Diseñado y desarrollado por **Johann Steven Toro Aguirre**. © Johann Steven Toro Aguirre.
