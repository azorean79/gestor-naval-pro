#!/bin/sh
set -e

# Ensure data directory exists
mkdir -p /app/data

# Run Prisma migrations against the SQLite database
echo "Running prisma db push..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 || echo "prisma db push warning (non-fatal)"

# Start the Next.js server
echo "Starting server..."
exec node server.js
