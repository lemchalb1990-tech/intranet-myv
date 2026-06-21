import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendStatusChangeEmail } from "@/lib/email";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const unidad = await prisma.unidad.findUnique({
    where: { id },
    include: {
      status: true,
      proyecto: { include: { inmobiliaria: true } },
      client: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!unidad) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(unidad);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, type, statusId, deliveryDate, notes } = body;

  try {
    const existing = await prisma.unidad.findUnique({
      where: { id },
      include: { status: true, client: { include: { user: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const { proyectoId, unitNumber, hasStorage, storageNumber, hasParking, parkingNumber } = body;

    const updated = await prisma.unidad.update({
      where: { id },
      data: {
        name: name ?? undefined,
        type: type ?? undefined,
        statusId: statusId ?? undefined,
        proyectoId: proyectoId !== undefined ? proyectoId : undefined,
        unitNumber: unitNumber !== undefined ? unitNumber : undefined,
        hasStorage: hasStorage !== undefined ? hasStorage : undefined,
        storageNumber: storageNumber !== undefined ? storageNumber : undefined,
        hasParking: hasParking !== undefined ? hasParking : undefined,
        parkingNumber: parkingNumber !== undefined ? parkingNumber : undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: { status: true, proyecto: { include: { inmobiliaria: true } }, client: { include: { user: true } } },
    });

    if (statusId && statusId !== existing.statusId) {
      try {
        await sendStatusChangeEmail(
          updated.client.user.email,
          updated.client.user.name,
          updated.name,
          updated.status.name
        );
      } catch (err) {
        console.error("Email error:", err);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.unidad.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
