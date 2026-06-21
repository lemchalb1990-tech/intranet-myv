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

    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      include: { status: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  }

  const projects = await prisma.project.findMany({
    where: clientId ? { clientId } : undefined,
    include: {
      status: true,
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
    const { name, type, clientId, statusId, deliveryDate, notes } = body;

    if (!name || !clientId || !statusId) {
      return NextResponse.json(
        { error: "Nombre, cliente y estado son requeridos" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        type: type ?? "Departamento",
        clientId,
        statusId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        notes: notes ?? null,
      },
      include: { status: true, client: { include: { user: true } } },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
