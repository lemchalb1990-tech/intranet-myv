DO $$
BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM ('VERDE', 'EN_BLANCO', 'ENTREGA_INMEDIATA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Proyecto" ADD COLUMN IF NOT EXISTS "deliveryStatus" "DeliveryStatus";
