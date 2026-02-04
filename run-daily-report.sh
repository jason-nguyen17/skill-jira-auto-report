#!/bin/bash

# Load environment variables
set -a
source /data/tools/claude/.env
set +a

cd /data/tools/claude

# Retry logic - max 3 attempts with 60s delay
MAX_RETRIES=3
RETRY_DELAY=60
# Set node version
nvm use 20

for i in $(seq 1 $MAX_RETRIES); do
    echo "🔄 Attempt $i/$MAX_RETRIES..."
    node daily-report.mjs && exit 0

    if [ $i -lt $MAX_RETRIES ]; then
        echo "⏳ Waiting ${RETRY_DELAY}s before retry..."
        sleep $RETRY_DELAY
    fi
done

echo "❌ Failed after $MAX_RETRIES attempts"
exit 1
