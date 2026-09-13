# ============================================================
# Apply pending migrations, then boot the Next.js production server.
# Requires DATABASE_URL / DIRECT_URL in the environment.
# ============================================================
#!/bin/sh
set -e

echo "[ladire] Applying database migrations..."
npx prisma migrate deploy

echo "[ladire] Starting server on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
exec npx next start -H "${HOSTNAME:-0.0.0.0}" -p "${PORT:-3000}"
