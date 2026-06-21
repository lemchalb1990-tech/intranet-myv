const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Hash pre-computado de "admin123" con bcrypt rounds=12
const ADMIN_PASSWORD_HASH = "$2b$12$WMDqkU2xOJz2uorkz2DLoOyZDcN6.g8DP.XvWTsykQ.hr1D0WWsdy";

async function main() {
  const { rows } = await pool.query(
    `SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' LIMIT 1`
  );

  if (rows.length > 0) {
    console.log("Seed ya ejecutado.");
    return;
  }

  const now = new Date().toISOString();
  const password = ADMIN_PASSWORD_HASH;

  await pool.query(
    `INSERT INTO "User" (id, rut, name, email, password, role, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [randomUUID(), "111111111", "Super Administrador", "admin@intranet.cl", password, "SUPER_ADMIN", true, now, now]
  );

  await pool.query(
    `INSERT INTO "ProjectStatus" (id, name, color, "order", "isDefault", "createdAt", "updatedAt") VALUES
     ($1, $2, $3, $4, $5, $6, $7),
     ($8, $9, $10, $11, $12, $13, $14),
     ($15, $16, $17, $18, $19, $20, $21)`,
    [
      randomUUID(), "En Blanco",          "#94a3b8", 0, false, now, now,
      randomUUID(), "En Verde",            "#86efac", 1, false, now, now,
      randomUUID(), "Entrega Inmediata",   "#fcd34d", 2, false, now, now,
    ]
  );

  await pool.query(
    `INSERT INTO "Settings" (id, "platformName", "primaryColor", "accentColor", "emailProvider", "smtpPort", "smtpSecure", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [randomUUID(), "Intranet MYV", "#475569", "#0f172a", "smtp", 587, false, now, now]
  );

  console.log("✓ Seed completado");
  console.log("  Admin RUT: 11.111.111-1");
  console.log("  Admin contraseña: admin123");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
