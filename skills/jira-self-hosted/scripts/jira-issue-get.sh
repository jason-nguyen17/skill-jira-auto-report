#!/usr/bin/env bash
# Get Jira issue details
# Usage: ./jira-issue-get.sh PROJ-123 [-f summary,status,description]
# Exit: 0=success, 1=failure
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env if exists
if [[ -f "$SCRIPT_DIR/../.env" ]]; then
  source "$SCRIPT_DIR/../.env"
elif [[ -f "$SCRIPT_DIR/.env" ]]; then
  source "$SCRIPT_DIR/.env"
fi

# Validate required vars
: "${JIRA_DOMAIN:?Error: JIRA_DOMAIN not set}"
: "${JIRA_PAT:?Error: JIRA_PAT not set}"

# Defaults
FIELDS=""
ISSUE_KEY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--fields)
      FIELDS="$2"
      shift 2
      ;;
    *)
      ISSUE_KEY="$1"
      shift
      ;;
  esac
done

if [[ -z "$ISSUE_KEY" ]]; then
  echo '{"error": "Issue key required. Usage: ./jira-issue-get.sh PROJ-123"}' >&2
  exit 1
fi

# Build URL with optional fields
url="${JIRA_DOMAIN}/rest/api/2/issue/${ISSUE_KEY}"
if [[ -n "$FIELDS" ]]; then
  url="${url}?fields=${FIELDS}"
fi

# Get issue
response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "$url")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [[ "$http_code" == "200" ]]; then
  echo "$body"
  exit 0
else
  echo "{\"error\": \"Failed to get issue\", \"http_code\": $http_code, \"response\": $body}" >&2
  exit 1
fi
