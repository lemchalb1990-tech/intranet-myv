import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendStatusChangeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (session.role === "CLIENT") {
    const client = await prisma.client.findUnique({ where: { userId: session.userId } });
    if (!client) return NextResponse.json([], { status: 200 });

    const projects = await prisma.unidad.findMany({
      where: { clientId: client.id },
      include: {
        status: true,
        proyecto: { include: { inmobiliaria: true } },
        steps: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, order: true, completedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  }

  const projects = await prisma.unidad.findMany({
    where: clientId ? { clientId } : undefined,
    include: {
      status: true,
      proyecto: { include: { inmobiliaria: true } },
      client: {
        include: { user: { select: { name: true, rut: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, type, clientId, statusId, deliveryDate, notes, proyectoId, unitNumber, hasStorage, storageNumber, hasParking, parkingNumber } = body;

    if ((!name && !proyectoId) || !clientId) {
      return NextResponse.json(
        { error: "Proyecto o nombre y cliente son requeridos" },
        { status: 400 }
      );
    }

    let resolvedName = name;
    let resolvedStatusId = statusId;
    let resolvedDeliveryDate = deliveryDate ? new Date(deliveryDate) : null;

    if (proyectoId) {
      const proy = await prisma.proyecto.findUnique({ where: { id: proyectoId } });
      if (!resolvedName) resolvedName = proy?.name ?? "Sin nombre";
      if (proy?.deliveryDate) resolvedDeliveryDate = proy.deliveryDate;
    }

    if (!resolvedStatusId) {
      const defaultStatus = await prisma.projectStatus.findFirst({ where: { isDefault: true } })
        ?? await prisma.projectStatus.findFirst({ orderBy: { order: "asc" } });
      if (!defaultStatus) {
        return NextResponse.json({ error: "No hay estados configurados" }, { status: 400 });
      }
      resolvedStatusId = defaultStatus.id;
    }

    const project = await prisma.unidad.create({
      data: {
        name: resolvedName,
        type: type ?? "Departamento",
        clientId,
        statusId: resolvedStatusId,
        proyectoId: proyectoId ?? null,
        unitNumber: unitNumber ?? null,
        hasStorage: hasStorage ?? false,
        storageNumber: storageNumber ?? null,
        hasParking: hasParking ?? false,
        parkingNumber: parkingNumber ?? null,
        deliveryDate: resolvedDeliveryDate,
        notes: notes ?? null,
      },
      include: { status: true, proyecto: { include: { inmobiliaria: true } }, client: { include: { user: true } } },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
