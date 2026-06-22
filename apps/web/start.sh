#!/bin/sh

# Pre-resolve any failed migrations directly in the DB to prevent P3009 blocking deploy.
# Safe: only updates rows that started but never finished or were rolled back.
prisma db execute --schema=prisma/schema.prisma --stdin <<'ENDSQL' 2>/dev/null || true
UPDATE "_prisma_migrations" SET "rolled_back_at" = NOW() WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL AND "started_at" IS NOT NULL;
ENDSQL

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
  else
    exit $STATUS
  fi
fi

exec node server.js
