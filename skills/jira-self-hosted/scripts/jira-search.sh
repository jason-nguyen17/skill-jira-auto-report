#!/usr/bin/env bash
# Search Jira issues using JQL
# Usage: ./jira-search.sh "project = PROJ AND status = Open" [-m 50] [-f key,summary,status]
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

# Defaults
MAX_RESULTS=50
FIELDS="key,summary,status,assignee,priority"
JQL=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--max-results)
      MAX_RESULTS="$2"
      shift 2
      ;;
    -f|--fields)
      FIELDS="$2"
      shift 2
      ;;
    *)
      JQL="$1"
      shift
      ;;
  esac
done

if [[ -z "$JQL" ]]; then
  echo '{"error": "JQL query required. Usage: ./jira-search.sh \"project = PROJ\""}' >&2
  exit 1
fi

# Convert comma-separated fields to JSON array
fields_json=$(echo "$FIELDS" | jq -R 'split(",")')

# Build request body
request_body=$(jq -n \
  --arg jql "$JQL" \
  --argjson maxResults "$MAX_RESULTS" \
  --argjson fields "$fields_json" \
  '{jql: $jql, startAt: 0, maxResults: $maxResults, fields: $fields}')

# Execute search
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  -d "$request_body" \
  "${JIRA_DOMAIN}/rest/api/2/search")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [[ "$http_code" == "200" ]]; then
  echo "$body"
  exit 0
else
  echo "{\"error\": \"Search failed\", \"http_code\": $http_code, \"response\": $body}" >&2
  exit 1
fi
