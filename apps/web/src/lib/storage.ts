import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  folder: string = "documents"
): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
  const ext = path.extname(originalName);
  const fileName = `${uuidv4()}${ext}`;
  const dir = path.join(UPLOAD_DIR, folder);
  ensureDir(dir);

  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, buffer);

  return {
    fileUrl: `/api/uploads/${folder}/${fileName}`,
    fileName: originalName,
    fileSize: buffer.length,
  };
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const relativePath = fileUrl.replace("/api/uploads/", "");
  const filePath = path.join(UPLOAD_DIR, relativePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getFilePath(fileUrl: string): string {
  const relativePath = fileUrl.replace("/api/uploads/", "");
  return path.join(UPLOAD_DIR, relativePath);
}

export async function saveLogo(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  const { fileUrl } = await saveFile(buffer, originalName, "logos");
  return fileUrl;
}
