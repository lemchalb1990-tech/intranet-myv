DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryStatus') THEN
    CREATE TYPE "DeliveryStatus" AS ENUM ('VERDE', 'EN_BLANCO', 'ENTREGA_INMEDIATA');
  END IF;
END $$;

ALTER TABLE "Proyecto" ADD COLUMN IF NOT EXISTS "deliveryStatus" "DeliveryStatus";
