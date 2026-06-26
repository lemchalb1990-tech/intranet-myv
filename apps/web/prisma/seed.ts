import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const existing = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (existing) {
    console.log("Seed ya ejecutado.");
    return;
  }

  const password = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      rut: "111111111",
      name: "Super Administrador",
      email: "admin@intranet.cl",
      password,
      role: "SUPER_ADMIN",
    },
  });

  await prisma.projectStatus.createMany({
    data: [
      { name: "Inicial",      color: "#94a3b8", order: 0, isDefault: true },
      { name: "En proceso",   color: "#3b82f6", order: 1 },
      { name: "Post Entrega", color: "#f59e0b", order: 2 },
      { name: "Entregado",    color: "#22c55e", order: 3 },
    ],
  });

  await prisma.settings.create({
    data: {
      platformName: "Intranet MYV",
      primaryColor: "#475569",
      accentColor: "#0f172a",
    },
  });

  console.log("✓ Seed completado");
  console.log("  Admin RUT: 11.111.111-1");
  console.log("  Admin contraseña: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
