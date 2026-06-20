import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendStatusChangeEmail } from "@/lib/email";

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
    const existing = await prisma.project.findUnique({
      where: { id },
      include: { status: true, client: { include: { user: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name ?? undefined,
        type: type ?? undefined,
        statusId: statusId ?? undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: { status: true, client: { include: { user: true } } },
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
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
