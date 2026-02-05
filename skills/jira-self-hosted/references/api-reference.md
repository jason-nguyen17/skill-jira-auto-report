# Jira REST API v2 Reference

## Base Configuration

```
Base URL: {JIRA_DOMAIN}/rest/api/2
Headers:
  Authorization: Bearer {JIRA_PAT}
  Content-Type: application/json
```

## Search Issues (JQL)

### POST /search (Recommended)

Best for complex JQL queries with field selection.

```bash
curl -s -X POST \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  -d '{
    "jql": "project = PROJ AND status = Open",
    "startAt": 0,
    "maxResults": 50,
    "fields": ["key", "summary", "status", "assignee", "priority"]
  }' \
  "${JIRA_DOMAIN}/rest/api/2/search"
```

**Request Body**

| Field | Type | Description |
|-------|------|-------------|
| jql | string | JQL query string |
| startAt | int | Pagination offset (default: 0) |
| maxResults | int | Max results per page (default: 50, max: 100) |
| fields | array | Fields to return (reduces payload) |
| expand | array | Expand options: "changelog", "renderedFields" |

**Response**

```json
{
  "startAt": 0,
  "maxResults": 50,
  "total": 125,
  "issues": [
    {
      "key": "PROJ-123",
      "fields": {
        "summary": "Issue title",
        "status": {"name": "Open"},
        "assignee": {"displayName": "John Doe"},
        "priority": {"name": "High"}
      }
    }
  ]
}
```

### With Changelog Expansion

```bash
curl -s -X POST \
  -H "Authorization: Bearer $JIRA_PAT" \
  -H "Content-Type: application/json" \
  -d '{
    "jql": "project = PROJ AND updated >= startOfDay(-1)",
    "maxResults": 50,
    "fields": ["key", "summary", "status", "assignee"],
    "expand": ["changelog"]
  }' \
  "${JIRA_DOMAIN}/rest/api/2/search"
```

**Response with Changelog**

```json
{
  "issues": [
    {
      "key": "PROJ-123",
      "fields": {
        "summary": "Issue title",
        "status": {"name": "In Progress"},
        "assignee": {"displayName": "John Doe"}
      },
      "changelog": {
        "startAt": 0,
        "maxResults": 100,
        "total": 5,
        "histories": [
          {
            "id": "12345",
            "author": {"displayName": "John Doe"},
            "created": "2026-02-04T14:30:00.000+0700",
            "items": [
              {
                "field": "status",
                "fieldtype": "jira",
                "from": "10001",
                "fromString": "Resolved",
                "to": "10002",
                "toString": "Reopened"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**Note:** Changelog limited to 100 most recent entries per issue.

### GET /search

Simple queries via URL parameters.

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  "${JIRA_DOMAIN}/rest/api/2/search?jql=project=PROJ&maxResults=10"
```

## Get Issue

### GET /issue/{key}

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  "${JIRA_DOMAIN}/rest/api/2/issue/PROJ-123"
```

**With Field Selection**

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  "${JIRA_DOMAIN}/rest/api/2/issue/PROJ-123?fields=summary,status,description,comment"
```

**Response**

```json
{
  "key": "PROJ-123",
  "fields": {
    "summary": "Issue title",
    "status": {"name": "In Progress"},
    "description": "Issue description text",
    "assignee": {"displayName": "John Doe", "emailAddress": "john@example.com"},
    "reporter": {"displayName": "Jane Smith"},
    "priority": {"name": "High"},
    "created": "2026-01-15T10:30:00.000+0000",
    "updated": "2026-01-20T14:45:00.000+0000",
    "comment": {
      "comments": [
        {"body": "Comment text", "author": {"displayName": "John"}}
      ]
    }
  }
}
```

## Comments

### GET /issue/{key}/comment

List all comments on an issue.

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  "${JIRA_DOMAIN}/rest/api/2/issue/PROJ-123/comment"
```

**Response**

```json
{
  "comments": [
    {
      "id": "10001",
      "body": "This is a comment",
      "author": {"displayName": "John Doe"},
      "created": "2026-01-15T10:30:00.000+0000",
      "updated": "2026-01-15T10:30:00.000+0000"
    }
  ],
  "total": 5
}
```

## Projects

### GET /project

List all accessible projects.

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  "${JIRA_DOMAIN}/rest/api/2/project"
```

**Response**

```json
[
  {
    "key": "PROJ",
    "name": "Project Name",
    "projectTypeKey": "software",
    "lead": {"displayName": "Project Lead"}
  }
]
```

### GET /project/{key}

Get project details.

```bash
curl -s \
  -H "Authorization: Bearer $JIRA_PAT" \
  "${JIRA_DOMAIN}/rest/api/2/project/PROJ"
```

## Pagination

For large result sets, use pagination:

```bash
# Page 1 (issues 0-49)
startAt=0&maxResults=50

# Page 2 (issues 50-99)
startAt=50&maxResults=50

# Page 3 (issues 100-149)
startAt=100&maxResults=50
```

**Check if more pages exist:**

```
hasMore = (startAt + maxResults) < total
```

## Common Fields

| Field | Description |
|-------|-------------|
| key | Issue key (e.g., PROJ-123) |
| summary | Issue title |
| description | Full description |
| status | Current status object |
| assignee | Assigned user object |
| reporter | Creator user object |
| priority | Priority level object |
| created | Creation timestamp |
| updated | Last update timestamp |
| labels | Array of label strings |
| components | Array of component objects |
| fixVersions | Target versions array |

## Error Responses

| Code | Meaning | Example |
|------|---------|---------|
| 400 | Bad Request | Invalid JQL syntax |
| 401 | Unauthorized | Invalid/expired PAT |
| 403 | Forbidden | No permission to resource |
| 404 | Not Found | Issue/project doesn't exist |

**Error Response Format**

```json
{
  "errorMessages": ["Issue does not exist or you do not have permission to see it"],
  "errors": {}
}
```
