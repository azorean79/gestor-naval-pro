#!/bin/bash
set -e

echo "==> Render build: installing dependencies"
npm ci

echo "==> Render build: generating Prisma client for PostgreSQL"
npx prisma generate --schema prisma/schema.postgresql.prisma

echo "==> Render build: deploying PostgreSQL migrations"
npx prisma migrate deploy --schema prisma/schema.postgresql.prisma

echo "==> Render build: building Next.js"
npm run build

echo "==> Render build: done"
