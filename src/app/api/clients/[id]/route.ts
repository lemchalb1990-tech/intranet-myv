import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateRut, normalizeRut } from "@/lib/rut";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, rut: true, isActive: true } },
      executive: { select: { id: true, name: true } },
      projects: { include: { status: true } },
      documents: {
        include: {
          requestedBy: { select: { name: true } },
          reviewedBy: { select: { name: true } },
          project: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  if (session.role === "EXECUTIVE" && client.executiveId !== session.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(client);
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
  const { name, email, phone, executiveId, isActive, rut } = body;

  try {
    const client = await prisma.client.findUnique({ where: { id }, include: { user: true } });
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    if (rut && !validateRut(rut)) {
      return NextResponse.json({ error: "RUT inválido" }, { status: 400 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        phone: phone ?? undefined,
        executiveId: executiveId ?? undefined,
        user: {
          update: {
            name: name ?? undefined,
            email: email ?? undefined,
            rut: rut ? normalizeRut(rut) : undefined,
            isActive: isActive ?? undefined,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, rut: true, isActive: true } },
        executive: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese RUT o email" },
        { status: 409 }
      );
    }
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

  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
