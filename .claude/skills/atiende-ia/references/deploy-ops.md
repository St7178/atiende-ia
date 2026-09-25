# Despliegue, variables y operación

## Variables de entorno (Vercel → tu proyecto → Settings → Environment Variables)

| Variable | Secreta | Para qué |
|---|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (+ `POSTGRES_*`, `PG*`) | Sí | Neon (las crea la integración de Vercel) |
| `PORTAL_USER`, `PORTAL_PASSWORD` | Sí | Credenciales maestras del admin; si faltan, el portal queda abierto |
| `SESSION_SECRET` | Sí | Firma de la cookie de sesión (opcional; si falta usa `PORTAL_PASSWORD`) |
| `N8N_PORTAL_SEND_WEBHOOK_URL` | Sí | URL de producción del webhook del flujo 02 |
| `PORTAL_WEBHOOK_SECRET` | Sí | Debe ser igual al valor del IF "Validar token del portal" en n8n |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No / Sí | Login con Google |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET` | Sí | Llamadas con IA y webhook |
| `ELEVENLABS_AGENT_ID`, `ELEVENLABS_PHONE_NUMBER_ID`, `ELEVENLABS_PHONE_PROVIDER` | No | Agente, número (`phnum_…`) y proveedor (`sip_trunk`/`twilio`) |

Las variables *Sensitive* de Vercel no se pueden leer ni con acceso (se ven como `[SENSITIVE]`). Para
saber si un secreto está cargado, prueba el comportamiento: p. ej. `POST /api/elevenlabs/post-call` sin
firma responde 401 si el secreto existe y 500 si falta.

Después de cambiar variables hay que **redesplegar** (Deployments → último → Redeploy, o
`npx vercel redeploy <url-del-último> --target production`).

## CLI

- Vercel: `npx vercel` (login por código de dispositivo). `vercel env ls`, `vercel env add NOMBRE
  production|preview|development` (valor por stdin), `vercel env rm`, `vercel ls`, `vercel redeploy`.
- GitHub: `gh auth login --web` con la cuenta dueña del repo. Si git tiene guardadas credenciales de
  otra cuenta, haz push con
  `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin <rama>`.
- MCP opcionales en `~/.claude.json` (scope usuario): `vercel` (`https://mcp.vercel.com`) y
  `elevenlabs` (`https://api.elevenlabs.io/v1/mcp`, OAuth). Solo cargan en conversaciones nuevas.

## Base de datos

- Cambios de esquema: nueva carpeta en `prisma/migrations/<fecha>_<nombre>/migration.sql` con SQL
  aditivo → `npx prisma migrate deploy` → `npx prisma generate`. Verifica con
  `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma`
  ("No difference detected").
- `prisma.config.ts` carga `.env.local` para el CLI.
- Consultas puntuales: un script `lib/__tmp.ts` con `prisma` ejecutado con
  `set -a; . ./.env.local; set +a; npx tsx lib/__tmp.ts`, y bórralo al terminar. Para probar SQL que
  escribe, usa una transacción que termine en error a propósito (rollback).

## Desarrollo local

- `npm run dev` (puerto 3000). Sin `PORTAL_USER` en `.env.local` el portal no pide login y actúa como
  el primer admin.
- `.claude/launch.json` tiene `portal-dev` (3000) y `portal-dev-auth` (3001, con credenciales de
  prueba solo locales) para el panel de vista previa.
- Para probar la actualización en vivo sin WhatsApp: crea un chat temporal (`wa_id` tipo
  `000TEST0001`) con un script, inserta mensajes `cliente` y mira que la lista cambie sola en ~2 s;
  bórralo al terminar. En el panel de vista previa la pestaña queda "oculta", así que fuerza
  `document.visibilityState = "visible"` para probar.
- Checklist antes de commit: `npx tsc --noEmit -p .` · `npx next build` · revisar en 375 px y escritorio.
  Si `tsc` se queja de `.next/types` de una página borrada, corre `next build` primero.

## Problemas conocidos

| Síntoma | Causa / solución |
|---|---|
| `fatal: detected dubious ownership` | Añade `-c safe.directory=<ruta-del-repo>` a cada comando git |
| `Repository not found` al hacer push | Credencial de otra cuenta; usa gh con la cuenta dueña del repo |
| `EPERM … query_engine-windows.dll.node` en `prisma generate` | Detén `next dev` y repite |
| Pantalla de error tras cambiar variables | Falta redeploy |
| Los heredocs largos en bash fallan en Windows | Escribe el script a un archivo y ejecútalo |
| Los mensajes nuevos no aparecen sin recargar | Revisa `GET /api/updates` (debe responder JSON con sesión) y que `LiveUpdates` esté en el layout |
