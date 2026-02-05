# PAT Authentication for Jira Server/Data Center

## Overview

Personal Access Tokens (PAT) provide secure, token-based authentication for Jira REST API calls. PATs are preferred over Basic Auth for integrations.

| Method | Security | Use Case |
|--------|----------|----------|
| PAT Bearer | High | Integrations, automation, CI/CD |
| Basic Auth | Medium | Legacy, deprecated |
| OAuth 2.0 | High | Limited support in Server/DC |

## Prerequisites

- Jira Server v8.14.0+ or Data Center
- "Enhance API Security for Jira REST APIs" enabled in admin settings
- User account with appropriate project permissions

## Creating a PAT

1. Log in to Jira
2. Click **Profile icon** > **Profile**
3. Select **Personal Access Tokens** (left sidebar)
4. Click **Create token**
5. Enter token name (e.g., "Claude Integration")
6. Set expiration (recommended: 90 days)
7. Click **Create**
8. **Copy token immediately** (shown only once)

## Usage

### Header Format

```
Authorization: Bearer <your_pat_token>
```

### cURL Example

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  "${JIRA_DOMAIN}/rest/api/2/myself"
```

### Environment Variables

```bash
export JIRA_DOMAIN="https://your-jira-instance.com"
export JIRA_PAT="your_personal_access_token"
```

## Security Best Practices

1. **Use service accounts**: Create dedicated account for integrations
2. **Set expiration**: Always set token expiry (90 days recommended)
3. **Minimal permissions**: Grant only required project access
4. **Environment variables**: Never hardcode tokens in scripts
5. **Regular audits**: Review and revoke unused tokens
6. **HTTPS only**: Always use HTTPS for API calls

## Token Management

### View Active Tokens

Profile > Personal Access Tokens > View all tokens

### Revoke Token

Profile > Personal Access Tokens > Select token > Revoke

### Token Rotation

1. Create new token before old expires
2. Update integrations with new token
3. Revoke old token

## Troubleshooting

### 401 Unauthorized

- Token expired or invalid
- Token not properly formatted in header
- Missing "Bearer " prefix

**Fix**: Verify token, regenerate if expired

### 403 Forbidden

- User lacks project/issue permissions
- Token scope insufficient

**Fix**: Check user permissions in Jira admin

### PAT Feature Disabled

- Security app may block PAT authentication
- Admin settings may disable PATs

**Fix**: Contact Jira admin to enable PAT support

### Connection Errors

- Incorrect JIRA_DOMAIN URL
- Missing https:// prefix
- Firewall/VPN blocking access

**Fix**: Verify URL format and network connectivity

## Testing Connection

```bash
# Test PAT authentication
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  "${JIRA_DOMAIN}/rest/api/2/myself" | jq '.displayName, .emailAddress'
```

Expected output: Your display name and email.
