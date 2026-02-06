#!/bin/bash

# Resolve script directory (works in cron, symlinks, and direct execution)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

# Load environment variables: .env.dev (dev) > .env (prod)
set -a
if [[ -f "$SCRIPT_DIR/.env.dev" ]]; then
  source "$SCRIPT_DIR/.env.dev"
elif [[ -f "$SCRIPT_DIR/.env" ]]; then
  source "$SCRIPT_DIR/.env"
fi
set +a

cd "$SCRIPT_DIR"

# Setup PATH for cron (nvm, node, claude not available in cron's minimal env)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
export PATH="$HOME/.local/bin:$PATH"

# Retry logic - max 3 attempts with 60s delay
MAX_RETRIES=3
RETRY_DELAY=60

for i in $(seq 1 $MAX_RETRIES); do
    echo "🔄 Attempt $i/$MAX_RETRIES..."
    node "$SCRIPT_DIR/daily-report.mjs" && exit 0

    if [ $i -lt $MAX_RETRIES ]; then
        echo "⏳ Waiting ${RETRY_DELAY}s before retry..."
        sleep $RETRY_DELAY
    fi
done

echo "❌ Failed after $MAX_RETRIES attempts"
exit 1
