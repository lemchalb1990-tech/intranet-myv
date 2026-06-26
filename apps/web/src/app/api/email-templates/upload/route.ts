import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const isImage = file.type.startsWith("image/");
  const folder = isImage ? "template-images" : "template-docs";

  const { fileUrl, fileName } = await saveFile(buffer, file.name, folder);

  return NextResponse.json({ url: fileUrl, name: fileName, type: file.type });
}
