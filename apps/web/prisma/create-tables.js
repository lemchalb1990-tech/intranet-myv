const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("Creando enums y tablas...");

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'EXECUTIVE', 'CLIENT');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'APPROVED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "User" (
      id          TEXT PRIMARY KEY,
      rut         TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        "Role" NOT NULL DEFAULT 'CLIENT',
      "isActive"  BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Client" (
      id            TEXT PRIMARY KEY,
      "userId"      TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      phone         TEXT,
      "executiveId" TEXT REFERENCES "User"(id),
      "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"   TIMESTAMP(3) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "ProjectStatus" (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      color       TEXT NOT NULL DEFAULT '#94a3b8',
      "order"     INTEGER NOT NULL DEFAULT 0,
      "isDefault" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Project" (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      type           TEXT NOT NULL DEFAULT 'Departamento',
      "clientId"     TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
      "statusId"     TEXT NOT NULL REFERENCES "ProjectStatus"(id),
      "deliveryDate" TIMESTAMP(3),
      notes          TEXT,
      "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"    TIMESTAMP(3) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Document" (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      "clientId"      TEXT NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
      "projectId"     TEXT REFERENCES "Project"(id),
      "requestedById" TEXT NOT NULL REFERENCES "User"(id),
      "requestNote"   TEXT,
      "fileName"      TEXT,
      "fileUrl"       TEXT,
      "fileType"      TEXT,
      "fileSize"      INTEGER,
      status          "DocumentStatus" NOT NULL DEFAULT 'PENDING',
      "reviewNote"    TEXT,
      "reviewedById"  TEXT REFERENCES "User"(id),
      "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "uploadedAt"    TIMESTAMP(3),
      "reviewedAt"    TIMESTAMP(3),
      "updatedAt"     TIMESTAMP(3) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Settings" (
      id               TEXT PRIMARY KEY,
      "platformName"   TEXT NOT NULL DEFAULT 'Intranet MYV',
      "logoUrl"        TEXT,
      "primaryColor"   TEXT NOT NULL DEFAULT '#475569',
      "accentColor"    TEXT NOT NULL DEFAULT '#0f172a',
      "emailProvider"  TEXT NOT NULL DEFAULT 'smtp',
      "smtpHost"       TEXT,
      "smtpPort"       INTEGER DEFAULT 587,
      "smtpSecure"     BOOLEAN NOT NULL DEFAULT false,
      "smtpUser"       TEXT,
      "smtpPassword"   TEXT,
      "smtpFrom"       TEXT,
      "resendApiKey"   TEXT,
      "resendFrom"     TEXT,
      "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"      TIMESTAMP(3) NOT NULL
    )
  `);

  console.log("✓ Tablas creadas correctamente");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
