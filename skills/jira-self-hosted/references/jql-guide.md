# JQL (Jira Query Language) Guide

## Basic Syntax

```
field operator value [AND|OR field operator value]... [ORDER BY field [ASC|DESC]]
```

## Operators

| Operator | Description | Example |
|----------|-------------|---------|
| = | Equals | `status = "Open"` |
| != | Not equals | `status != Done` |
| ~ | Contains (text) | `summary ~ "bug"` |
| !~ | Not contains | `summary !~ "test"` |
| > | Greater than | `created > -7d` |
| >= | Greater or equal | `priority >= High` |
| < | Less than | `updated < -30d` |
| <= | Less or equal | `duedate <= endOfWeek()` |
| IN | In list | `status IN (Open, "In Progress")` |
| NOT IN | Not in list | `priority NOT IN (Low, Lowest)` |
| IS | Null check | `assignee IS EMPTY` |
| IS NOT | Not null | `assignee IS NOT EMPTY` |
| WAS | Historical | `status WAS "Open"` |
| CHANGED | Changed | `status CHANGED` |

## Keywords

| Keyword | Description |
|---------|-------------|
| AND | Both conditions must match |
| OR | Either condition matches |
| NOT | Negate condition |
| ORDER BY | Sort results |
| ASC | Ascending order |
| DESC | Descending order |

## Common Fields

| Field | Type | Description |
|-------|------|-------------|
| project | Text | Project key (e.g., PROJ) |
| status | Text | Issue status |
| assignee | User | Assigned user |
| reporter | User | Issue creator |
| priority | Text | Priority level |
| type | Text | Issue type (Bug, Task, Story) |
| created | Date | Creation date |
| updated | Date | Last update date |
| duedate | Date | Due date |
| resolution | Text | Resolution status |
| labels | Text | Issue labels |
| component | Text | Component name |
| fixVersion | Text | Target version |
| sprint | Text | Sprint name |
| summary | Text | Issue title |
| description | Text | Issue description |

## Date Functions

| Function | Description |
|----------|-------------|
| now() | Current timestamp |
| currentUser() | Logged-in user |
| startOfDay() | Start of today |
| endOfDay() | End of today |
| startOfWeek() | Start of current week |
| endOfWeek() | End of current week |
| startOfMonth() | Start of current month |
| endOfMonth() | End of current month |
| startOfYear() | Start of current year |

## Relative Dates

| Format | Description |
|--------|-------------|
| -1d | 1 day ago |
| -7d | 7 days ago |
| -1w | 1 week ago |
| -1m | 1 month ago |
| +1d | 1 day from now |

## Sprint Functions

| Function | Description |
|----------|-------------|
| openSprints() | All open sprints |
| closedSprints() | All closed sprints |
| futureSprints() | Future sprints |

## Example Queries

### My Issues

```jql
assignee = currentUser() AND status != Done ORDER BY priority DESC
```

### Open Bugs in Project

```jql
project = PROJ AND type = Bug AND status = Open
```

### High Priority Unassigned

```jql
priority IN (High, Highest) AND assignee IS EMPTY
```

### Updated This Week

```jql
updated >= startOfWeek() ORDER BY updated DESC
```

### Created Last 7 Days

```jql
created >= -7d ORDER BY created DESC
```

### Issues in Current Sprint

```jql
sprint IN openSprints() AND project = PROJ
```

### Overdue Issues

```jql
duedate < now() AND status != Done
```

### Search in Summary/Description

```jql
summary ~ "performance" OR description ~ "slow"
```

### Issues Without Labels

```jql
project = PROJ AND labels IS EMPTY
```

### Recently Resolved

```jql
resolved >= -7d ORDER BY resolved DESC
```

### Blocked Issues

```jql
status = "Blocked" OR labels = "blocked"
```

### By Component

```jql
project = PROJ AND component = "Backend"
```

### Multiple Status

```jql
status IN ("To Do", "In Progress", "In Review")
```

### Exclude Subtasks

```jql
project = PROJ AND issuetype != Sub-task
```

## Custom Fields

Access custom fields by name or ID:

```jql
"Custom Field Name" = "value"
cf[10001] = "value"
```

## Tips

1. **Quote values with spaces**: `status = "In Progress"`
2. **Case insensitive**: Field names are case insensitive
3. **Use parentheses**: Group complex conditions `(A OR B) AND C`
4. **Escape special chars**: Use `\\` for backslash
5. **Empty values**: Use `IS EMPTY` or `IS NOT EMPTY`
