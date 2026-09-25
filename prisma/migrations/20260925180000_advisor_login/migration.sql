-- Login por asesor: usuario, contraseña (hash scrypt) y rol. El correo pasa a
-- ser opcional y se usa para iniciar sesion con Google.
ALTER TABLE "advisors" ADD COLUMN "username" TEXT;
ALTER TABLE "advisors" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "advisors" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'asesor';
ALTER TABLE "advisors" ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX "advisors_username_key" ON "advisors"("username");
