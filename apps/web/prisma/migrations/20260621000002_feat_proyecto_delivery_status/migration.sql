CREATE TYPE "DeliveryStatus" AS ENUM ('VERDE', 'EN_BLANCO', 'ENTREGA_INMEDIATA');

ALTER TABLE "Proyecto" ADD COLUMN "deliveryStatus" "DeliveryStatus";
