-- CreateTable
CREATE TABLE "advisors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_color" TEXT NOT NULL DEFAULT '#6C5CE7',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "wa_id" TEXT NOT NULL,
    "contact_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'bot',
    "pipeline_stage" TEXT NOT NULL DEFAULT 'nuevo',
    "assigned_advisor_id" INTEGER,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("wa_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" BIGSERIAL NOT NULL,
    "wa_id" TEXT,
    "wamid" TEXT,
    "sender" TEXT NOT NULL,
    "advisor_id" INTEGER,
    "body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_knowledge" (
    "id" SERIAL NOT NULL,
    "knowledge_text" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "advisors_email_key" ON "advisors"("email");

-- CreateIndex
CREATE INDEX "conversations_pipeline_stage_idx" ON "conversations"("pipeline_stage");

-- CreateIndex
CREATE INDEX "messages_wa_id_idx" ON "messages"("wa_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_advisor_id_fkey" FOREIGN KEY ("assigned_advisor_id") REFERENCES "advisors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_wa_id_fkey" FOREIGN KEY ("wa_id") REFERENCES "conversations"("wa_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
