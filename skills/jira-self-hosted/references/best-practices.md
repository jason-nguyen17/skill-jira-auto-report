# Best Practices for Jira API Integration

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check JQL syntax, validate JSON |
| 401 | Unauthorized | Refresh token, verify PAT |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify resource exists |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with delay |

### Error Response Parsing

```bash
response=$(curl -s -w "\n%{http_code}" ...)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [[ "$http_code" != "200" ]]; then
  error_msg=$(echo "$body" | jq -r '.errorMessages[0] // "Unknown error"')
  echo "Error: $error_msg" >&2
  exit 1
fi
```

### Retry Logic

```bash
max_retries=3
retry_delay=2

for ((i=1; i<=max_retries; i++)); do
  response=$(curl -s ...)
  if [[ $? -eq 0 ]]; then
    break
  fi
  sleep $((retry_delay * i))
done
```

## Rate Limits

### Server/Data Center
- No hard limits documented
- Implement client-side throttling
- Recommended: 2-5 requests/second

### Pagination
- Use `startAt` + `maxResults` for large queries
- Max 100 results per request
- Always check `total` vs returned count

```bash
# Paginated fetch
start_at=0
max_results=50
total=999

while [[ $start_at -lt $total ]]; do
  response=$(curl ... -d "{\"startAt\": $start_at, \"maxResults\": $max_results}")
  total=$(echo "$response" | jq '.total')
  # Process issues...
  start_at=$((start_at + max_results))
done
```

## Security

### Token Management
1. Store in environment variables
2. Never log or print tokens
3. Set token expiration (90 days max)
4. Use dedicated service accounts
5. Revoke unused tokens promptly

### Secure Storage
```bash
# Good: Environment variable
export JIRA_PAT="token"

# Good: .env file with restricted permissions
chmod 600 .env

# Bad: Hardcoded in script
JIRA_PAT="token"  # Never do this
```

### HTTPS Only
- Always use https:// URLs
- Verify SSL certificates
- Never disable certificate validation

## Performance

### Field Selection
Reduce payload by requesting only needed fields:

```bash
# Bad: Returns all fields
curl .../issue/PROJ-123

# Good: Returns only needed fields
curl ".../issue/PROJ-123?fields=summary,status,assignee"
```

### Efficient JQL
```jql
# Bad: Slow, returns many results
project = PROJ

# Good: Specific, fewer results
project = PROJ AND status = Open AND updated >= -7d
```

### Batch Operations
- Group related queries where possible
- Use search endpoint vs individual GET calls
- Cache frequently accessed data locally

## Common Patterns

### Check Issue Exists
```bash
http_code=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $JIRA_PAT" \
  "${JIRA_DOMAIN}/rest/api/2/issue/PROJ-123")

if [[ "$http_code" == "200" ]]; then
  echo "Issue exists"
fi
```

### Extract Specific Fields
```bash
curl -s ... | jq '{
  key: .key,
  summary: .fields.summary,
  status: .fields.status.name,
  assignee: .fields.assignee.displayName
}'
```

### Count Results Only
```bash
curl -s ... -d '{"jql": "...", "maxResults": 0}' | jq '.total'
```

## Troubleshooting

### Connection Issues
- Verify JIRA_DOMAIN URL format (include https://)
- Check firewall/VPN access
- Test with curl verbose: `curl -v ...`

### Authentication Failures
- Verify PAT not expired
- Check user permissions
- Confirm PAT feature enabled in Jira admin

### JQL Errors
- Validate query syntax in Jira UI first
- Quote values with spaces
- Escape special characters
