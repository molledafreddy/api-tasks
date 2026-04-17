#!/bin/sh
set -e

echo "▶ Ejecutando migraciones..."
pnpm run migration:run:prod

echo "▶ Iniciando API..."
exec node dist/main.js
