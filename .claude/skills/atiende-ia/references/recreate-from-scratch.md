# Crear el portal desde cero

Orden recomendado para montar el portal para una empresa nueva. Cada paso indica qué debe hacer el
usuario (cuentas, pagos, consolas) y qué puede hacer Claude.

1. **Código**
   - Copia todo el contenido de `assets/source/` de la skill, incluidos los archivos ocultos
     (`.gitignore`, `.env.example`, `.gitattributes`), a la carpeta del proyecto nuevo:
     `cp -r <skill>/assets/source/. <carpeta-nueva>/`. No reescribas los archivos a mano: la copia
     compila tal cual (`npm ci` → `npx prisma generate` → `npx next build`).
   - En Claude Code crea los archivos directamente en el disco del usuario. En un chat de claude.ai
     (sin acceso al disco del usuario), genera un `.zip` con `assets/source/` para que lo descargue.
   - `git init` y subir a un repo propio (GitHub) para que Vercel despliegue.
2. **Marca** — pregúntale al usuario el nombre de su empresa/portal, su logo y su color. Edita solo
   `lib/brand.ts` (textos, `logoUrl` → pon el logo en `public/brand/`, `colors`), el `name` y
   `description` de `package.json`, y regenera el fondo de los chats con
   `node <skill>/scripts/gen-wallpaper.mjs --color "<color de marca>" --bg "<fondo oscuro>"`.
   Detalles en `references/ui-design.md`.
3. **Base de datos** — crear Postgres en Neon (idealmente desde Vercel → Storage, que crea
   `DATABASE_URL`/`DATABASE_URL_UNPOOLED`). Luego `npx prisma migrate deploy` (crea todas las tablas).
4. **Vercel** — importar el repo, cargar las variables de `assets/env.example`
   (`PORTAL_USER`, `PORTAL_PASSWORD`, `SESSION_SECRET` como mínimo) y desplegar.
5. **Primer ingreso** — entrar con `PORTAL_USER`/`PORTAL_PASSWORD` (crea el admin), escribir la base de
   conocimiento de la empresa en **Conocimiento** y crear los asesores en **Asesores**.
6. **WhatsApp (Meta)** — app de Meta con WhatsApp Cloud API, número y token permanente (usuario del
   sistema). Anotar el *phone number id*.
7. **n8n** — crear credenciales "Postgres account" (misma base de Neon), "WhatsApp account" y OpenAI.
   Importar `assets/n8n/01-…json` y `02-…json`, y en ellos:
   - reemplazar `PEGA_AQUI_TU_VERIFY_TOKEN_DE_META` por un token inventado (el mismo que se pone en
     Meta) y `PEGA_AQUI_EL_PORTAL_WEBHOOK_SECRET` por un secreto nuevo;
   - reemplazar `PEGA_AQUI_TU_PHONE_NUMBER_ID` por el *phone number id* del paso 6;
   - reasignar credenciales en cada nodo y **activar** ambos flujos.
8. **Conectar** — en Meta, webhook = `https://<n8n>/webhook/wa-webhook-inbound` con el verify token,
   suscrito a `messages`. En Vercel, `N8N_PORTAL_SEND_WEBHOOK_URL` = `https://<n8n>/webhook/portal-send-message`
   y `PORTAL_WEBHOOK_SECRET` = el secreto del paso 7. Redeploy.
9. **Probar** — escribir al WhatsApp: debe responder la IA y aparecer el chat en el portal. Tomar el
   control y responder desde el portal.
10. **Opcional: Google** — `references/auth.md`.
11. **Opcional: llamadas con IA** — cuenta ElevenLabs, agente con `assets/elevenlabs/agente-ventas.md`
    adaptado a la empresa (publicarlo), número SIP (Telnyx verificado con saldo) importado en
    ElevenLabs, webhook de fin de llamada a `/api/elevenlabs/post-call`, y variables `ELEVENLABS_*` en
    Vercel. Ver `references/voice-calls.md`.
