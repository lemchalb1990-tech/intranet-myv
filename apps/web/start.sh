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
    echo "Found failed migration, rolling back and retrying..."
    FAILED=$(grep -oE '[0-9]{14}_[a-zA-Z_]+' /tmp/migrate.log | head -1)
    if [ -n "$FAILED" ]; then
      prisma migrate resolve --rolled-back "$FAILED" || true
    fi
    prisma migrate deploy --schema=prisma/schema.prisma || exit 1
  else
    exit $STATUS
  fi
fi

exec node server.js
