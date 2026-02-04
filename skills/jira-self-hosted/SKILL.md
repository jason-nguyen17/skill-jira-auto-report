---
name: jira-self-hosted
description: Query Jira Server/Data Center via REST API. Search issues (JQL), view issue details, list projects, view comments. Use for task tracking, sprint queries, issue lookup. READ-only operations.
version: 1.0.0
license: MIT
allowed-tools:
  - Bash
---

# Jira Self-Hosted (Server/Data Center)

Query and view Jira issues via REST API v2 with PAT authentication.

## When to Use

Use when:
- Searching issues with JQL queries
- Viewing issue details (summary, status, assignee)
- Listing projects
- Reading comments
- Answering questions about Jira data

**Scope: READ-only** (no create/update operations)

## Quick Reference

### Authentication
- **Reference**: `references/authentication.md` - PAT setup, header format, troubleshooting

### API Endpoints
- **Reference**: `references/api-reference.md` - Search, issues, projects, comments

### JQL Queries
- **Reference**: `references/jql-guide.md` - Syntax, operators, example queries

### Best Practices
- **Reference**: `references/best-practices.md` - Error handling, security, performance

### Helper Scripts
- `scripts/jira-auth-test.sh` - Validate PAT connection
- `scripts/jira-search.sh "JQL"` - Execute JQL queries
- `scripts/jira-issue-get.sh PROJ-123` - Get issue details

## Environment Setup

Required environment variables:
```bash
export JIRA_DOMAIN="https://your-jira-instance.com"
export JIRA_PAT="your_personal_access_token"
```

Or use `.env` file in scripts directory.

## Implementation Workflow

1. Set up environment variables (JIRA_DOMAIN, JIRA_PAT)
2. Test connection: `./scripts/jira-auth-test.sh`
3. Search issues: `./scripts/jira-search.sh "project = PROJ AND status = Open"`
4. View issue: `./scripts/jira-issue-get.sh PROJ-123`

## Platform Requirements

- Jira Server v8.14.0+ or Data Center (PAT support)
- `curl` and `jq` available in environment

## Defect Detection Logic

### Định nghĩa Defect
1. **Bug Type**: Issue có `issuetype = Bug`
2. **QC Reject**: Issue bị reject từ Testing → work states (To Do, In Progress, Resolved)

### Workflow chuẩn (KHÔNG phải defect)
```
In Progress → Resolved → Testing → Done
```

### Workflow có defect (QC Reject)
```
In Progress → Resolved → Testing → [Resolved/In Progress/To Do] → ... → Done
                            ↑
                      QC found issue
```

### Exclusions khi đếm defects by Developer
- Exclude: `DurianNhi` (QC), `Jira Automation`, `Unassigned`
- Developer = người move issue to `Resolved` (không phải assignee)

### Metrics
- **Defect Rate** = (Bug Type + QC Rejects) / Total Issues × 100%
- **QC Reject** = Transition từ `testing` → `{to do, in progress, in development, open, resolved}`
