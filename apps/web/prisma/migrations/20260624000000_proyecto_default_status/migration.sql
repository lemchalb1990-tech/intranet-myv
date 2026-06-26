ALTER TABLE "Proyecto" ADD COLUMN IF NOT EXISTS "defaultStatusId" TEXT;

ALTER TABLE "Proyecto" DROP CONSTRAINT IF EXISTS "Proyecto_defaultStatusId_fkey";
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_defaultStatusId_fkey"
  FOREIGN KEY ("defaultStatusId") REFERENCES "ProjectStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
