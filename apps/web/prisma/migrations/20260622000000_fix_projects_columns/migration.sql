-- Repair: ensure all Unidad/projects columns exist regardless of prior migration state

ALTER TABLE "projects"
    ADD COLUMN IF NOT EXISTS "proyectoId"    TEXT,
    ADD COLUMN IF NOT EXISTS "unitNumber"    TEXT,
    ADD COLUMN IF NOT EXISTS "hasStorage"    BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "storageNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "hasParking"    BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "parkingNumber" TEXT;

ALTER TABLE "Document"
    ADD COLUMN IF NOT EXISTS "stepId" TEXT;

CREATE TABLE IF NOT EXISTS "Inmobiliaria" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "rut"       TEXT,
    "address"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inmobiliaria_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM ('VERDE', 'EN_BLANCO', 'ENTREGA_INMEDIATA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Proyecto" (
    "id"             TEXT NOT NULL,
    "inmobiliariaId" TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "type"           TEXT NOT NULL DEFAULT 'Departamento',
    "address"        TEXT,
    "deliveryStatus" "DeliveryStatus",
    "deliveryDate"   TIMESTAMP(3),
    "description"    TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Proyecto" DROP CONSTRAINT IF EXISTS "Proyecto_inmobiliariaId_fkey";
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_inmobiliariaId_fkey"
    FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "UnitStep" (
    "id"             TEXT NOT NULL,
    "unidadId"       TEXT NOT NULL,
    "order"          INTEGER NOT NULL DEFAULT 0,
    "name"           TEXT NOT NULL,
    "description"    TEXT,
    "notifyEnabled"  BOOLEAN NOT NULL DEFAULT false,
    "notifyTemplate" TEXT,
    "completedAt"    TIMESTAMP(3),
    "completedById"  TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UnitStep_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UnitStep" DROP CONSTRAINT IF EXISTS "UnitStep_unidadId_fkey";
ALTER TABLE "UnitStep" ADD CONSTRAINT "UnitStep_unidadId_fkey"
    FOREIGN KEY ("unidadId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UnitStep" DROP CONSTRAINT IF EXISTS "UnitStep_completedById_fkey";
ALTER TABLE "UnitStep" ADD CONSTRAINT "UnitStep_completedById_fkey"
    FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_proyectoId_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_proyectoId_fkey"
    FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_stepId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_stepId_fkey"
    FOREIGN KEY ("stepId") REFERENCES "UnitStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id"          TEXT NOT NULL,
    "unidadId"    TEXT NOT NULL,
    "stepName"    TEXT NOT NULL,
    "clientName"  TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "sentByName"  TEXT NOT NULL,
    "subject"     TEXT NOT NULL,
    "body"        TEXT NOT NULL,
    "sentAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "NotificationLog" DROP CONSTRAINT IF EXISTS "NotificationLog_unidadId_fkey";
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_unidadId_fkey"
    FOREIGN KEY ("unidadId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Proyecto"
    ADD COLUMN IF NOT EXISTS "deliveryStatus" "DeliveryStatus";
