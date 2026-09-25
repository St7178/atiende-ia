# Asesores, roles e inicio de sesión

## Cómo funciona

- **Administrador maestro**: entra con `PORTAL_USER` / `PORTAL_PASSWORD` (variables de Vercel). El
  primer ingreso crea la fila `advisors` con `role = 'admin'` (`ensureAdminAdvisor()` en
  `lib/currentAdvisor.ts`). Si esas variables no existen (desarrollo local), el portal queda abierto y
  actúa como el primer administrador.
- **Asesores**: los crea el admin en la página **Asesores** con nombre, usuario (`[a-z0-9._-]{3,30}`),
  contraseña inicial (mín. 8, guardada con scrypt en `lib/password.ts`), correo de Google opcional y rol.
  Desde la misma lista se editan usuario, correo, contraseña, rol y se activan o desactivan.
- **Sesión**: cookie `portal_session` = `"<advisorId>.<expira>.<HMAC>"`, válida 12 h, firmada con
  `SESSION_SECRET` (o `PORTAL_PASSWORD` si falta). `proxy.ts` solo verifica la firma; que el asesor
  siga activo se revisa en el servidor (`getCurrentAdvisor()`). Si fue desactivado, el layout lo manda a
  `/api/auth/logout`, que borra la cookie y muestra el motivo en el login.
- **Google**: `/api/auth/google` → Google → `/api/auth/google/callback`. Guarda un `state` anti-CSRF en
  cookie, canjea el código y acepta solo correos verificados que coincidan (sin importar mayúsculas)
  con un asesor **activo**. El botón aparece cuando existen `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

## Permisos

| Acción | Asesor | Admin |
|---|---|---|
| Ver y atender chats, tomar el control, enviar, llamar con IA | Sí | Sí |
| Ver la base de conocimiento | Sí (solo lectura) | Sí |
| Editar la base de conocimiento | No (sin editor y rechazado en el servidor) | Sí |
| Página Asesores (crear, editar, desactivar) | No (se redirige a Chats y no aparece en el menú) | Sí |
| Asignar un chat a un administrador | No (oculto en la lista y rechazado en el servidor) | Sí |
| Quitarse el rol de admin o desactivarse a sí mismo | — | No |

Regla: toda restricción se aplica en el **servidor** (server action o página) además de en la
interfaz.

## Configurar Google (una vez)

1. Google Cloud Console → **OAuth consent screen**: tipo *External*, con el nombre del portal. En modo
   *Testing* solo entran los *Test users*; para todos, publicarla (solo pide `openid email profile`,
   no requiere revisión).
2. **Credentials → OAuth client ID → Web application**, URI de redirección:
   `https://<tu-dominio>/api/auth/google/callback`.
3. Vercel: `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` (el secret lo pega el usuario) y redeploy.
4. En el portal, poner el correo de Google en la ficha de cada asesor. Un correo solo puede estar en
   un asesor.

## Probar sin escribir contraseñas

Para verificar pantallas por rol en local sin usar el formulario de login: levanta el servidor con
credenciales de prueba (config `portal-dev-auth` de `.claude/launch.json`, puerto 3001), genera un
token con `createSessionToken(id)` usando el mismo `SESSION_SECRET` y ponlo en la cookie
`portal_session`. Si creas asesores de prueba en la base real, bórralos al terminar.
