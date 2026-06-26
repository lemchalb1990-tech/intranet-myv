#!/bin/sh

prisma migrate deploy --schema=prisma/schema.prisma > /tmp/migrate.log 2>&1
STATUS=$?
cat /tmp/migrate.log

if [ $STATUS -ne 0 ]; then
  if grep -q "P3005" /tmp/migrate.log; then
    echo "Database not empty, baselining existing migrations..."
    for dir in /app/prisma/migrations/*/; do
      [ -d "$dir" ] && prisma migrate resolve --applied "$(basename "$dir")" || true
    done
    prisma migrate deploy --schema=prisma/schema.prisma || exit 1
  elif grep -q "P3009" /tmp/migrate.log; then
    echo "Found failed migration, applying schema manually and marking as applied..."
    prisma db execute --schema=prisma/schema.prisma --stdin 2>&1 <<'ENDSQL' || true
DO $$
BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM ('VERDE', 'EN_BLANCO', 'ENTREGA_INMEDIATA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "Proyecto" ADD COLUMN IF NOT EXISTS "deliveryStatus" "DeliveryStatus";
ENDSQL
    FAILED=$(sed -n 's/.*`\([^`]*\)` migration.*/\1/p' /tmp/migrate.log | head -1)
    echo "Marking as applied: [$FAILED]"
    if [ -n "$FAILED" ]; then
      prisma migrate resolve --applied "$FAILED"
    fi
    prisma migrate deploy --schema=prisma/schema.prisma || exit 1
  else
    exit $STATUS
  fi
fi

# Verify the projects table actually exists. If migrations were previously
# marked as applied without running (P3005 baseline on an empty DB), the
# table will be missing even though migrate deploy exited 0.
echo "Verifying database tables..."
prisma db execute --schema=prisma/schema.prisma --stdin > /tmp/verify.log 2>&1 <<'ENDSQL'
SELECT 1 FROM "projects" LIMIT 0;
ENDSQL

if [ $? -ne 0 ]; then
  echo "Tables missing despite migrations marked as applied. Resetting migration state..."
  prisma db execute --schema=prisma/schema.prisma --stdin <<'ENDSQL' || true
TRUNCATE TABLE "_prisma_migrations";
ENDSQL
  prisma migrate deploy --schema=prisma/schema.prisma || exit 1
fi

exec node server.js
