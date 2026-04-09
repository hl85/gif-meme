#!/usr/bin/env bash
set -euo pipefail

echo "=== GifMeme Production Deployment ==="
echo ""

echo "1. Pre-flight checks..."
npx tsc --noEmit
echo "   TypeScript: OK"
npx vitest run
echo "   Tests: OK"

echo ""
echo "2. Building..."
npx opennextjs-cloudflare build
echo "   Build: OK"

BUNDLE_SIZE=$(wc -c < .open-next/worker.js)
BUNDLE_MB=$(echo "scale=2; $BUNDLE_SIZE / 1048576" | bc)
echo "   Bundle size: ${BUNDLE_MB} MiB"

echo ""
echo "3. Setting secrets (skip with Ctrl+C if already set)..."
for SECRET in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET JWT_SECRET KLIPY_API_KEY ADMIN_EMAILS; do
  echo "   Setting $SECRET..."
  wrangler secret put "$SECRET" || echo "   Skipped $SECRET"
done

echo ""
echo "4. Deploying to Cloudflare Workers..."
wrangler deploy

echo ""
echo "5. Applying D1 migrations..."
for migration in drizzle/*.sql; do
  echo "   Applying: $migration"
  wrangler d1 execute gifmeme-db --file="$migration" --remote
done

echo ""
echo "6. Smoke testing production..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org)
echo "   GET https://gifmeme.org -> $HTTP_STATUS"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org/api/gifs/trending)
echo "   GET /api/gifs/trending -> $API_STATUS"
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://gifmeme.org/admin)
echo "   GET /admin -> $ADMIN_STATUS (expect 401/403)"

echo ""
echo "=== Deployment complete ==="
