-- Initial schema: base tables required before incremental migrations

-- Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'EXECUTIVE', 'CLIENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User
CREATE TABLE IF NOT EXISTS "User" (
  "id"        TEXT NOT NULL,
  "rut"       TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "password"  TEXT NOT NULL,
  "role"      "Role" NOT NULL DEFAULT 'CLIENT',
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_rut_key" ON "User"("rut");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Client
CREATE TABLE IF NOT EXISTS "Client" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "phone"       TEXT,
  "executiveId" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Client_userId_key" ON "Client"("userId");

ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_userId_fkey";
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_executiveId_fkey";
ALTER TABLE "Client" ADD CONSTRAINT "Client_executiveId_fkey"
  FOREIGN KEY ("executiveId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ProjectStatus
CREATE TABLE IF NOT EXISTS "ProjectStatus" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "color"     TEXT NOT NULL DEFAULT '#94a3b8',
  "order"     INTEGER NOT NULL DEFAULT 0,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectStatus_pkey" PRIMARY KEY ("id")
);

-- projects (Unidad model) — all columns included so marked-applied incremental migrations don't leave gaps
CREATE TABLE IF NOT EXISTS "projects" (
  "id"            TEXT NOT NULL,
  "clientId"      TEXT NOT NULL,
  "proyectoId"    TEXT,
  "unitNumber"    TEXT,
  "hasStorage"    BOOLEAN NOT NULL DEFAULT false,
  "storageNumber" TEXT,
  "hasParking"    BOOLEAN NOT NULL DEFAULT false,
  "parkingNumber" TEXT,
  "name"          TEXT NOT NULL,
  "type"          TEXT NOT NULL DEFAULT 'Departamento',
  "statusId"      TEXT NOT NULL,
  "deliveryDate"  TIMESTAMP(3),
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_clientId_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_statusId_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_statusId_fkey"
  FOREIGN KEY ("statusId") REFERENCES "ProjectStatus"("id") ON UPDATE CASCADE;

-- Document — stepId column is added in migration 20260621000000
CREATE TABLE IF NOT EXISTS "Document" (
  "id"            TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "clientId"      TEXT NOT NULL,
  "projectId"     TEXT,
  "requestedById" TEXT NOT NULL,
  "requestNote"   TEXT,
  "fileName"      TEXT,
  "fileUrl"       TEXT,
  "fileType"      TEXT,
  "fileSize"      INTEGER,
  "status"        "DocumentStatus" NOT NULL DEFAULT 'PENDING',
  "reviewNote"    TEXT,
  "reviewedById"  TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedAt"    TIMESTAMP(3),
  "reviewedAt"    TIMESTAMP(3),
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_clientId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_projectId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_requestedById_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON UPDATE CASCADE;

ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_reviewedById_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Settings
CREATE TABLE IF NOT EXISTS "Settings" (
  "id"            TEXT NOT NULL,
  "platformName"  TEXT NOT NULL DEFAULT 'Intranet MYV',
  "logoUrl"       TEXT,
  "primaryColor"  TEXT NOT NULL DEFAULT '#475569',
  "accentColor"   TEXT NOT NULL DEFAULT '#0f172a',
  "emailProvider" TEXT NOT NULL DEFAULT 'smtp',
  "smtpHost"      TEXT,
  "smtpPort"      INTEGER DEFAULT 587,
  "smtpSecure"    BOOLEAN NOT NULL DEFAULT false,
  "smtpUser"      TEXT,
  "smtpPassword"  TEXT,
  "smtpFrom"      TEXT,
  "resendApiKey"  TEXT,
  "resendFrom"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
