import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { name, type, address, deliveryStatus, deliveryDate, description } = await req.json();

  const updated = await prisma.proyecto.update({
    where: { id },
    data: {
      name: name ?? undefined,
      type: type ?? undefined,
      address: address !== undefined ? address : undefined,
      deliveryStatus: deliveryStatus !== undefined ? (deliveryStatus || null) : undefined,
      deliveryDate:
        deliveryStatus === "ENTREGA_INMEDIATA"
          ? new Date()
          : deliveryDate !== undefined
          ? deliveryDate
            ? new Date(deliveryDate)
            : null
          : undefined,
      description: description !== undefined ? description : undefined,
    },
    include: { inmobiliaria: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
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
  await prisma.proyecto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
