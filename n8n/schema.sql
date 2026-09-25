-- Esquema que usan los workflows de n8n (01 y 02) y el portal.
-- La fuente de verdad son las migraciones de Prisma (prisma/migrations); este
-- archivo es una referencia legible del resultado final. Motor: Postgres (Neon).

create table advisors (
  id            serial primary key,
  name          text not null,
  email         text unique,                     -- correo de Google para iniciar sesion (opcional)
  username      text unique,                     -- usuario para /login
  password_hash text,                            -- scrypt$<salt>$<hash>
  role          text not null default 'asesor',  -- admin | asesor
  avatar_color  text not null default '#6C5CE7',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table conversations (
  wa_id               text primary key,        -- numero de WhatsApp del cliente (57XXXXXXXXXX)
  contact_name        text,
  status              text not null default 'bot',      -- bot | pendiente_humano | human | resuelto
  pipeline_stage      text not null default 'nuevo',    -- nuevo | esperando_asesor | en_atencion | resuelto
  assigned_advisor_id int references advisors(id),
  last_message_at     timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create table messages (
  id          bigserial primary key,
  wa_id       text references conversations(wa_id),
  wamid       text,        -- id del mensaje de WhatsApp, o "elevenlabs:<conversation_id>:inicio|fin" en llamadas
  sender      text not null,  -- cliente | bot | asesor | llamada
  advisor_id  int references advisors(id),
  body        text,
  created_at  timestamptz not null default now()
);

create table company_knowledge (
  id             serial primary key,
  knowledge_text text not null,   -- base de conocimiento que usa la IA (editable en el portal)
  updated_at     timestamptz not null default now()
);

create index messages_wa_id_idx on messages(wa_id);
create index conversations_pipeline_stage_idx on conversations(pipeline_stage);
