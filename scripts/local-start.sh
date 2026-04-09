#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_PORT="${LOCAL_PORT:-8787}"
PERSIST_DIR=".wrangler/state"
ENV_TEMPLATE=".env.local.example"
ENV_FILE=".env.local"
DEV_VARS_TEMPLATE=".dev.vars.example"
DEV_VARS_FILE=".dev.vars"

copy_if_missing() {
  local source_file="$1"
  local target_file="$2"

  if [[ -f "$target_file" ]]; then
    return
  fi

  cp "$source_file" "$target_file"
  echo "Created $target_file from template."
}

ensure_file() {
  local file_path="$1"
  if [[ ! -f "$file_path" ]]; then
    echo "Missing required file: $file_path" >&2
    exit 1
  fi
}

kill_port_process() {
  local port="$1"
  local pids

  pids=$(lsof -t -iTCP:"$port" -sTCP:LISTEN || true)
  if [[ -n "$pids" ]]; then
    echo "Port $port is busy. Killing processes: $pids"
    kill -9 $pids 2>/dev/null || true
    sleep 1 # Wait for port to be released
  fi
}

run_d1_json() {
  local sql="$1"
  npx wrangler d1 execute gifmeme-db \
    --local \
    --persist-to "$PERSIST_DIR" \
    --command "$sql" \
    --json
}

parse_wrapped_json() {
  node -e "let input=''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => { const start = input.indexOf('['); const end = input.lastIndexOf(']'); if (start === -1 || end === -1 || end < start) { process.stderr.write('Unable to locate JSON payload in Wrangler output.\\n'); process.exit(1); } process.stdout.write(input.slice(start, end + 1)); });"
}

apply_migration_file() {
  local migration_path="$1"
  local output

  if output="$(npx wrangler d1 execute gifmeme-db --local --persist-to "$PERSIST_DIR" --file "$migration_path" 2>&1)"; then
    printf '%s\n' "$output"
    return 0
  fi

  printf '%s\n' "$output"

  if [[ "$output" == *"already exists"* ]]; then
    return 10
  fi

  return 1
}

copy_if_missing "$ENV_TEMPLATE" "$ENV_FILE"
copy_if_missing "$DEV_VARS_TEMPLATE" "$DEV_VARS_FILE"

ensure_file "$ENV_FILE"
ensure_file "$DEV_VARS_FILE"

set -a
. "$ENV_FILE"
set +a

kill_port_process "$DEFAULT_PORT"
SELECTED_PORT="$DEFAULT_PORT"

export LOCAL_PORT="$SELECTED_PORT"
export NEXT_PUBLIC_APP_URL="http://localhost:$SELECTED_PORT"
export NEXT_PUBLIC_BASE_URL="http://localhost:$SELECTED_PORT"
export PLAYWRIGHT_BASE_URL="http://localhost:$SELECTED_PORT"

mkdir -p "$PERSIST_DIR"

echo "==> Installing dependencies"
npm install

echo "==> Building OpenNext worker"
npx opennextjs-cloudflare build

echo "==> Preparing local D1 state"
run_d1_json 'CREATE TABLE IF NOT EXISTS __local_migrations (name TEXT PRIMARY KEY NOT NULL, applied_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));' >/dev/null

for migration in drizzle/*.sql; do
  migration_name="$(basename "$migration")"
  already_applied="$({ run_d1_json "SELECT name FROM __local_migrations WHERE name = '$migration_name';" || true; } | parse_wrapped_json | node -e "let input=''; process.stdin.on('data', c => input += c); process.stdin.on('end', () => { const parsed = JSON.parse(input || '[]'); const rows = parsed[0]?.results ?? []; process.stdout.write(rows.length > 0 ? 'yes' : 'no'); });")"

  if [[ "$already_applied" == "yes" ]]; then
    echo "   Skipping $migration_name (already applied)"
    continue
  fi

  echo "   Applying $migration_name"
  set +e
  migration_output="$(apply_migration_file "$migration")"
  migration_status=$?
  set -e

  if [[ -n "$migration_output" ]]; then
    printf '%s\n' "$migration_output"
  fi

  if [[ $migration_status -eq 10 ]]; then
    echo "   Detected existing schema objects for $migration_name; marking as applied."
  elif [[ $migration_status -ne 0 ]]; then
    echo "   Failed to apply $migration_name" >&2
    exit $migration_status
  fi

  run_d1_json "INSERT INTO __local_migrations (name) VALUES ('$migration_name');" >/dev/null
done

echo "==> Starting local worker on http://localhost:$SELECTED_PORT"
echo "    Admin emails: ${ADMIN_EMAILS:-not-configured}"
echo "    Local state: $PERSIST_DIR"

exec npx wrangler dev --local --persist-to "$PERSIST_DIR" --port "$SELECTED_PORT"
