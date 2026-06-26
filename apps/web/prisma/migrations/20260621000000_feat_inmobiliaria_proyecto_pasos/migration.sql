-- CreateTable Inmobiliaria
CREATE TABLE "Inmobiliaria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rut" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inmobiliaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable Proyecto
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "inmobiliariaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Departamento',
    "address" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable UnitStep
CREATE TABLE "UnitStep" (
    "id" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "notifyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyTemplate" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UnitStep_pkey" PRIMARY KEY ("id")
);

-- AlterTable projects (Unidad) — IF NOT EXISTS: initial migration may have created these already
ALTER TABLE "projects"
    ADD COLUMN IF NOT EXISTS "proyectoId"    TEXT,
    ADD COLUMN IF NOT EXISTS "unitNumber"    TEXT,
    ADD COLUMN IF NOT EXISTS "hasStorage"    BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "storageNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "hasParking"    BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "parkingNumber" TEXT;

-- AlterTable Document
ALTER TABLE "Document"
    ADD COLUMN IF NOT EXISTS "stepId" TEXT;

-- AddForeignKey Proyecto -> Inmobiliaria
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_inmobiliariaId_fkey"
    FOREIGN KEY ("inmobiliariaId") REFERENCES "Inmobiliaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey UnitStep -> projects
ALTER TABLE "UnitStep" ADD CONSTRAINT "UnitStep_unidadId_fkey"
    FOREIGN KEY ("unidadId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey UnitStep -> User (completedBy)
ALTER TABLE "UnitStep" ADD CONSTRAINT "UnitStep_completedById_fkey"
    FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey projects -> Proyecto
ALTER TABLE "projects" ADD CONSTRAINT "projects_proyectoId_fkey"
    FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Document -> UnitStep
ALTER TABLE "Document" ADD CONSTRAINT "Document_stepId_fkey"
    FOREIGN KEY ("stepId") REFERENCES "UnitStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
