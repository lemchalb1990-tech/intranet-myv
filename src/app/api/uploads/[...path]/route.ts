import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFilePath } from "@/lib/storage";
import fs from "fs";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { path: pathSegments } = await params;
  const filePath = getFilePath(pathSegments.join("/"));

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const contentTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };

  const contentType = contentTypes[ext] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: { "Content-Type": contentType },
  });
}
