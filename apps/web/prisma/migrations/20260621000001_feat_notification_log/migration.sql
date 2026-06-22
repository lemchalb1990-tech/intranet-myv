-- CreateTable NotificationLog
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "sentByName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey NotificationLog -> projects (Unidad)
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_unidadId_fkey"
    FOREIGN KEY ("unidadId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
