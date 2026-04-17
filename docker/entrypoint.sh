#!/bin/sh
set -e

echo "▶ Ejecutando migraciones..."
npx typeorm -d dist/database/data-source.js migration:run || echo "⚠ Migraciones fallaron (puede ser primera ejecución sin DB lista)"

echo "▶ Iniciando API..."
exec node dist/main.js
