-- Renombrar estados existentes preservando IDs (y por tanto las FK de unidades ya asignadas)
UPDATE "ProjectStatus" SET name = 'Inicial',      color = '#94a3b8', "order" = 0, "isDefault" = true  WHERE name = 'En Blanco';
UPDATE "ProjectStatus" SET name = 'En proceso',   color = '#3b82f6', "order" = 1, "isDefault" = false WHERE name = 'En Verde';
UPDATE "ProjectStatus" SET name = 'Post Entrega', color = '#f59e0b', "order" = 2, "isDefault" = false WHERE name = 'Entrega Inmediata';

-- Insertar "Entregado" solo si no existe
INSERT INTO "ProjectStatus" (id, name, color, "order", "isDefault", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Entregado', '#22c55e', 3, false, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "ProjectStatus" WHERE name = 'Entregado');

-- Asegurar que exactamente un estado sea el predeterminado (el de orden 0)
UPDATE "ProjectStatus" SET "isDefault" = false WHERE "order" != 0;
UPDATE "ProjectStatus" SET "isDefault" = true  WHERE "order" = 0;
