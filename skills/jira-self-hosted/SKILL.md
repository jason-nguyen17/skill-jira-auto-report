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
- `scripts/jira-search.sh "JQL" [-e changelog]` - Execute JQL queries with optional changelog expansion
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

## Status Transition Tracking

### Enabling Changelog

```bash
./scripts/jira-search.sh "project = PROJ AND updated >= startOfDay(-1)" -e changelog
```

### Use Cases (Hỏi đáp)

Skill có thể trả lời các câu hỏi về transitions:

| Câu hỏi | Cách xử lý |
|---------|------------|
| "Issue PSV2-123 đã qua những status nào?" | Lấy changelog, list all status transitions |
| "Ai đã move issue này sang Resolved?" | Tìm transition có `toString = "Resolved"`, trả về `author` |
| "Có bao nhiêu issue bị reopen hôm qua?" | Filter transitions có `toString` in ["Reopened", "To Do", "In Progress"] từ "Resolved"/"Testing"/"Done" |
| "John đã resolve bao nhiêu issue?" | Count transitions có `author.displayName = "John"` và `toString = "Resolved"` |
| "Issue nào bị reject từ Testing?" | Filter transitions có `fromString = "Testing"` và `toString` != "Done" |

### Changelog Response Structure

```json
{
  "changelog": {
    "histories": [{
      "author": {"displayName": "John Doe"},
      "created": "2026-02-04T14:30:00.000+0700",
      "items": [{
        "field": "status",
        "fromString": "In Progress",
        "toString": "Resolved"
      }]
    }]
  }
}
```

### Parsing Guidelines

1. Filter `items` where `field === "status"` (bỏ qua các field khác)
2. Filter by `created` date nếu cần giới hạn time range
3. `fromString` = status trước, `toString` = status sau
4. `author` = người thực hiện transition

### Backward Compatibility

If Jira instance doesn't support changelog:
- Graceful degradation - trả lời dựa trên current status only
- Thông báo: "Changelog không khả dụng, chỉ có thể xem status hiện tại"

## Statistics & Reporting Use Cases

### Project Statistics

| Câu hỏi | JQL | Xử lý |
|---------|-----|-------|
| "Có bao nhiêu issues trong PSV2?" | `project = PSV2` | Lấy `total` từ response |
| "Bao nhiêu bug đang open?" | `project = PSV2 AND type = Bug AND status != Done` | Lấy `total` |
| "Issues tạo tuần này?" | `project = PSV2 AND created >= startOfWeek()` | Lấy `total` |

### User Statistics

| Câu hỏi | JQL | Xử lý |
|---------|-----|-------|
| "John có bao nhiêu task?" | `assignee = "John" AND status != Done` | Lấy `total` |
| "Ai đang có nhiều task nhất?" | Query từng user, so sánh `total` | Multiple queries |
| "John resolve bao nhiêu issue tuần này?" | Cần changelog: filter transitions có `author = John` và `toString = Resolved` | Dùng expand=changelog |

### Workload Comparison

Để so sánh workload giữa team members:
1. Lấy danh sách team members
2. Query issues cho từng người: `assignee = "Name" AND status IN ("In Progress", "To Do")`
3. Tổng hợp và so sánh `total`

### Time-based Statistics

| Câu hỏi | JQL |
|---------|-----|
| "Issues tuần này" | `updated >= startOfWeek()` |
| "Issues tháng này" | `updated >= startOfMonth()` |
| "Issues 7 ngày qua" | `updated >= -7d` |
| "Issues hôm qua" | `updated >= startOfDay(-1) AND updated < startOfDay()` |
