#!/bin/sh
set -e

# Cloud Run entrypoint - PostgreSQL mode
# DATABASE_URL is provided as an environment variable from Cloud Run / Neon

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set. Please configure it in Cloud Run env vars."
  exit 1
fi

echo "Running Prisma migrations against PostgreSQL..."
npx prisma migrate deploy --schema prisma/schema.postgresql.prisma 2>&1 || {
  echo "prisma migrate deploy failed, trying db push..."
  npx prisma db push --schema prisma/schema.postgresql.prisma --accept-data-loss 2>&1 || echo "db push warning (non-fatal)"
}

echo "Starting server..."
exec node server.js
