import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isExecutive = session.role === "EXECUTIVE";

  const clientWhere = isExecutive ? { executiveId: session.userId } : undefined;
  const projectWhere = isExecutive ? { client: { executiveId: session.userId } } : undefined;
  const documentWhere = isExecutive
    ? { status: "UPLOADED" as const, client: { executiveId: session.userId } }
    : { status: "UPLOADED" as const };

  const [totalClients, totalProjects, pendingDocs, projectsByStatus] =
    await Promise.all([
      prisma.client.count({ where: clientWhere }),
      prisma.project.count({ where: projectWhere }),
      prisma.document.count({ where: documentWhere }),
      prisma.projectStatus.findMany({
        include: {
          _count: { select: { projects: true } },
        },
        orderBy: { order: "asc" },
      }),
    ]);

  return NextResponse.json({
    totalClients,
    totalProjects,
    pendingDocs,
    projectsByStatus: projectsByStatus.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      count: s._count.projects,
    })),
  });
}
