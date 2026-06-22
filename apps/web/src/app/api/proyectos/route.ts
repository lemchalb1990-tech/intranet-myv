import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const inmobiliariaId = searchParams.get("inmobiliariaId");

  const proyectos = await prisma.proyecto.findMany({
    where: inmobiliariaId ? { inmobiliariaId } : undefined,
    include: {
      inmobiliaria: { select: { id: true, name: true } },
      _count: { select: { unidades: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(proyectos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { inmobiliariaId, name, type, address, deliveryStatus, deliveryDate, description } = body;

  if (!inmobiliariaId || !name) {
    return NextResponse.json({ error: "Inmobiliaria y nombre son requeridos" }, { status: 400 });
  }

  const proyecto = await prisma.proyecto.create({
    data: {
      inmobiliariaId,
      name,
      type: type ?? "Departamento",
      address: address ?? null,
      deliveryStatus: deliveryStatus ?? null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      description: description ?? null,
    },
    include: { inmobiliaria: { select: { id: true, name: true } } },
  });

  return NextResponse.json(proyecto, { status: 201 });
}
