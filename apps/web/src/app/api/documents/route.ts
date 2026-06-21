import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendDocumentRequestEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (session.role === "CLIENT") {
    const client = await prisma.client.findUnique({ where: { userId: session.userId } });
    if (!client) return NextResponse.json([], { status: 200 });

    const docs = await prisma.document.findMany({
      where: { clientId: client.id },
      include: {
        requestedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(docs);
  }

  const docs = await prisma.document.findMany({
    where: clientId ? { clientId } : undefined,
    include: {
      client: { include: { user: { select: { name: true, rut: true } } } },
      requestedBy: { select: { name: true } },
      reviewedBy: { select: { name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, clientId, projectId, requestNote } = body;

    if (!title || !clientId) {
      return NextResponse.json(
        { error: "Título y cliente son requeridos" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const doc = await prisma.document.create({
      data: {
        title,
        clientId,
        projectId: projectId ?? null,
        requestedById: session.userId,
        requestNote: requestNote ?? null,
        status: "PENDING",
      },
      include: {
        requestedBy: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    try {
      await sendDocumentRequestEmail(
        client.user.email,
        client.user.name,
        title,
        requestNote
      );
    } catch (err) {
      console.error("Email error:", err);
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
