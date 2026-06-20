import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendDocumentReviewEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { client: { include: { user: true } } },
  });

  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  if (session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { status, reviewNote } = body;

  const updated = await prisma.document.update({
    where: { id },
    data: {
      status: status ?? undefined,
      reviewNote: reviewNote !== undefined ? reviewNote : undefined,
      reviewedById: session.userId,
      reviewedAt: new Date(),
    },
    include: {
      client: { include: { user: true } },
      requestedBy: { select: { name: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  if (status === "APPROVED" || status === "REJECTED") {
    try {
      await sendDocumentReviewEmail(
        doc.client.user.email,
        doc.client.user.name,
        doc.title,
        status === "APPROVED",
        reviewNote
      );
    } catch (err) {
      console.error("Email error:", err);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
