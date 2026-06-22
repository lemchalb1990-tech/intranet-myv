import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendStepNotificationEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, stepId } = await params;

  const step = await prisma.unitStep.findUnique({
    where: { id: stepId },
    include: {
      unidad: {
        include: {
          proyecto: { include: { inmobiliaria: true } },
          client: { include: { user: true, executive: true } },
        },
      },
    },
  });

  if (!step || step.unidadId !== id) {
    return NextResponse.json({ error: "Paso no encontrado" }, { status: 404 });
  }

  const updated = await prisma.unitStep.update({
    where: { id: stepId },
    data: { completedAt: new Date(), completedById: session.userId },
    include: { completedBy: { select: { name: true } } },
  });

  if (step.notifyEnabled && step.notifyTemplate) {
    const { unidad } = step;
    const cliente = unidad.client.user;
    const proyecto = unidad.proyecto;
    const ejecutivo = unidad.client.executive;

    const variables: Record<string, string> = {
      nombre: cliente.name,
      proyecto: proyecto?.name ?? "",
      inmobiliaria: proyecto?.inmobiliaria?.name ?? "",
      unidad: unidad.unitNumber ?? unidad.name,
      paso: step.name,
      ejecutivo: ejecutivo?.name ?? "",
      fecha: new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" }),
      bodega: unidad.storageNumber ?? "",
      estacionamiento: unidad.parkingNumber ?? "",
    };

    const body = step.notifyTemplate.replace(
      /\{\{(\w+)\}\}/g,
      (_, key: string) => variables[key] ?? ""
    );

    const subject = `Actualización: ${step.name}`;
    const sentByUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });

    try {
      await sendStepNotificationEmail(cliente.email, subject, body);
    } catch (err) {
      console.error("Email error:", err);
    }

    await prisma.notificationLog.create({
      data: {
        unidadId: id,
        stepName: step.name,
        clientName: cliente.name,
        clientEmail: cliente.email,
        sentByName: sentByUser?.name ?? session.userId,
        subject,
        body,
      },
    });
  }

  return NextResponse.json(updated);
}
