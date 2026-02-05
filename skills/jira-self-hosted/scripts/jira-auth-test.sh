#!/usr/bin/env bash
# Validate Jira PAT authentication
# Usage: ./jira-auth-test.sh
# Exit: 0=success, 1=failure
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env
if [[ -f "$SCRIPT_DIR/../.env" ]]; then
  source "$SCRIPT_DIR/../.env"
fi

# Validate required vars
: "${JIRA_DOMAIN:?Error: JIRA_DOMAIN not set}"
: "${JIRA_PAT:?Error: JIRA_PAT not set}"

# Test authentication
response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "${JIRA_DOMAIN}/rest/api/2/myself")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [[ "$http_code" == "200" ]]; then
  echo "$body"
  exit 0
else
  echo "{\"error\": \"Authentication failed\", \"http_code\": $http_code, \"response\": $body}" >&2
  exit 1
fi
