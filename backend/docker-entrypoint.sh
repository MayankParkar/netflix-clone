#!/bin/sh
set -e

echo "Running database setup..."
cd /app

# --skip-generate tells Prisma NOT to re-run prisma generate after pushing
# We already generated the client during the Docker build — no need to redo it
# This avoids the permission error on node_modules/prisma
node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --skip-generate

echo "Database ready. Starting server..."
exec node dist/index.js
