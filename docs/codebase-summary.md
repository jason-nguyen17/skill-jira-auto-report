# Codebase Summary

**Project:** skill-jira-auto-report
**Generated:** 2026-02-05
**Total Files:** 15
**Total LOC:** ~830
**Language:** JavaScript (Node.js), Bash, Markdown

## Overview

skill-jira-auto-report is a Claude Code skill for Jira automation. It provides two interfaces:

1. **Interactive** - Q&A via Claude CLI using `/jira-self-hosted` skill
2. **Automated** - Daily reports via cron job with Telegram notifications

Both share the same Jira API integration layer (REST API v2 with PAT authentication).

---

## File Structure & Responsibilities

```
skill-jira-auto-report/
├── README.md                          # Main documentation (VN + EN)
├── daily-report.mjs                   # Cron script: spawn Claude, send Telegram
├── run-daily-report.sh                # Shell wrapper: env loading, retry logic
├── install-skill.sh                   # Installer script: copy files, setup .env
├── env.claude                         # Template for JIRA_DOMAIN, JIRA_PAT
├── .env.example                       # Template for Telegram config
├── .gitignore                         # Exclude .env, node_modules
└── skills/jira-self-hosted/
    ├── SKILL.md                       # Skill definition for Claude CLI
    ├── scripts/
    │   ├── jira-auth-test.sh          # Test PAT connection
    │   ├── jira-search.sh             # Execute JQL queries
    │   └── jira-issue-get.sh          # Get issue details by key
    └── references/
        ├── api-reference.md           # REST API v2 endpoints
        ├── authentication.md          # PAT setup guide
        ├── jql-guide.md               # JQL syntax reference
        └── best-practices.md          # Error handling, security
```

---

## Component Breakdown

### 1. Skill Interface (`skills/jira-self-hosted/`)

#### SKILL.md (103 LOC)
**Purpose:** Claude CLI skill definition

**Key Sections:**
- Metadata: name, description, version, license
- When to Use: scope (read-only operations)
- Quick Reference: links to documentation
- Environment Setup: JIRA_DOMAIN, JIRA_PAT variables
- Implementation Workflow: step-by-step usage
- Defect Detection Logic: bug type + QC reject definitions

**Used By:** Claude CLI to recognize `/jira-self-hosted` command

---

### 2. Helper Scripts (`skills/jira-self-hosted/scripts/`)

#### jira-auth-test.sh (34 LOC)
**Purpose:** Validate PAT connection and Jira instance

**Flow:**
1. Load `.env` (JIRA_DOMAIN, JIRA_PAT)
2. Execute GET /rest/api/2/myself
3. Parse response with jq
4. Print username or error

**Used By:** Manual testing during setup

**Exit Codes:**
- 0 = Success (authenticated)
- 1 = Unauthorized (invalid PAT)
- 2 = Connection error

---

#### jira-search.sh (93 LOC)
**Purpose:** Execute JQL queries and return formatted JSON with optional expand parameters

**Flow:**
1. Accept JQL query as argument
2. Load `.env` (JIRA_DOMAIN, JIRA_PAT)
3. POST to /rest/api/2/search with JQL
4. Request fields: key, summary, status, assignee, priority, updated
5. Optional: expand changelog to include issue change history
6. Parse with jq, print issues array

**Parameters:**
- `-m|--max-results` - Maximum results (default: 50)
- `-f|--fields` - Comma-separated field list (default: key,summary,status,assignee,priority)
- `-e|--expand` - Expand parameters like "changelog" for status transition tracking

**Usage:**
```bash
./jira-search.sh 'project = PSV2 AND updated >= startOfDay(-1)'
./jira-search.sh 'project = PSV2' -m 100 -f key,summary,status -e changelog
```

**Output:** JSON array of issues with optional changelog containing status transitions

**Changelog Expand:**
When using `-e changelog`, response includes full change history for each issue:
- Original values (fromString)
- New values (toString)
- Author and timestamp of each change
- Field name (filter for "status" changes to get transitions)

---

#### jira-issue-get.sh (63 LOC)
**Purpose:** Fetch full issue details by key

**Flow:**
1. Accept issue key (e.g., PROJ-123)
2. Load `.env`
3. GET /rest/api/2/issue/{key}
4. Request fields: summary, status, description, assignee, reporter, priority, created, updated, comment
5. Parse and print

**Usage:**
```bash
./jira-issue-get.sh PROJ-123
```

**Output:** Full issue JSON with comments

---

### 3. Documentation References (`skills/jira-self-hosted/references/`)

#### api-reference.md (231 LOC)
**Endpoints Covered:**
- POST /search (JQL with field selection)
- GET /search (simple queries)
- GET /issue/{key} (full details)
- GET /issue/{key}/comment (comments list)
- GET /project (all projects)
- GET /project/{key} (project details)

**For Each Endpoint:**
- curl example
- Request body/params table
- Response schema (JSON)
- Pagination logic
- Error codes (400, 401, 403, 404)

---

#### authentication.md (121 LOC)
**Topics:**
- PAT generation (profile → tokens)
- Header format: `Authorization: Bearer {PAT}`
- curl testing example
- Common errors: invalid token, expired, insufficient permission
- Troubleshooting: domain without trailing slash

---

#### jql-guide.md (194 LOC)
**Coverage:**
- Basic syntax: project = KEY, status = WORD
- Operators: AND, OR, NOT, IN, LIKE
- Field names: status, assignee, reporter, type, priority, created, updated
- Date functions: startOfDay(-1), startOfWeek(), endOfMonth()
- Example queries:
  - Yesterday's updates: `updated >= startOfDay(-1) AND updated < startOfDay()`
  - Sprint tasks: `sprint = "Sprint 10" AND status != Done`
  - QA work: `issuetype = Bug OR status = Testing`

---

#### best-practices.md (183 LOC)
**Sections:**
- Error Handling: retry logic (3x), exponential backoff, log context
- Security: never log PAT, use Bearer auth, read-only access
- Performance: limit queries (maxResults=100), pagination, field selection
- Rate Limiting: API quotas, queue long-running queries
- Monitoring: log request/response times, track defect rates

---

### 4. Automation Layer (`daily-report.mjs`, `run-daily-report.sh`)

#### run-daily-report.sh (32 LOC)
**Purpose:** Shell wrapper for Node.js script

**Flow:**
1. Check Node.js installed
2. Load .env or .env.dev (Telegram config)
3. Export variables for daily-report.mjs
4. Retry loop: spawn `node daily-report.mjs` (3 attempts, 5s delay)
5. Exit with success/failure code

**Environment Priority:**
- .env.dev (development, if exists)
- .env (production)

**Timeout:** 5 minutes per attempt

---

#### daily-report.mjs (>250 LOC)
**Purpose:** Main automation script with status transitions tracking

**Configuration Block (Lines 1-31):**
```javascript
const JIRA_PROJECTS = ["PSV2", "DIC", "DEPOT", "AVA"];    // Projects to track
const MAIN_PROJECT = "PSV2";                               // Team member source
const EXCLUDED_USERS = ["Jira Automation", "Unassigned"]; // Skip users
const JIRA_STATUSES = {                                    // Status names
  done: "Done",
  resolved: "Resolved",
  testing: "Testing",
  inProgress: "In Progress",
  toDo: "To Do"
};
```

**Telegram Config (Lines 32-38):**
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID (private, for errors)
- TELEGRAM_GROUP_CHAT_ID (group, for reports)
- TELEGRAM_GROUP_THREAD_ID (optional, for topics)

**DAILY_PROMPT (Lines 41-127):**
- 📊 emoji requirement
- HTML formatting (no markdown)
- 3-step JQL query structure with status transitions tracking
- Step 2.5: Status Transitions Analysis
  - Parse changelog for status field changes
  - Filter changes from previous day
  - Display all transitions with: KEY: fromStatus → toStatus (Author, HH:mm)
  - Highlight exceptional transitions (reopen, reject, unexpected)
- Report format specification with transitions section
- No Telegram markdown (use HTML tags)

**Status Transitions Feature:**
- Uses `expand=changelog` in jira-search.sh call (Line 59)
- Analyzes changelog items for "status" field changes
- Tracks fromString and toString values with timestamps
- Categorizes transitions to identify:
  - Normal workflow (Testing → Resolved → Done)
  - QC rejects (Testing → In Progress)
  - Issue reopens (Done/Resolved → In Progress/To Do)
- Displays all transitions in daily report for visibility

**Main Logic (Lines 129+):**
1. `runClaudeCode(prompt)` - Spawn Claude CLI with transitions-aware prompt
2. `sendTelegramMessage()` - POST to Telegram Bot API
3. Success path: send to group chat with transitions section
4. Error path: send to private chat with stack trace

---

### 5. Installation & Setup

#### install-skill.sh (88 LOC)
**Purpose:** Set up skill in Claude Code environment

**Steps:**
1. Check Claude CLI installed
2. Check mkdir -p for ~/.claude/skills/jira-self-hosted/
3. Copy SKILL.md to skill folder
4. Copy scripts/ folder
5. Copy references/ folder
6. Create env.claude template if missing
7. Create .env.example if missing
8. Print setup instructions

**Idempotent:** Safe to run multiple times

---

### 6. Configuration Templates

#### env.claude
Template for JIRA_DOMAIN and JIRA_PAT. Copied to `~/.claude/skills/jira-self-hosted/.env` by installer.

```bash
JIRA_DOMAIN="https://jira.example.com"
JIRA_PAT="abc123def456..."
```

#### .env.example
Template for Telegram bot configuration.

```bash
TELEGRAM_BOT_TOKEN="123456:ABC..."
TELEGRAM_CHAT_ID="123456789"
TELEGRAM_GROUP_CHAT_ID="-100123456789"
TELEGRAM_GROUP_THREAD_ID="123"
```

---

## Data Flow Diagrams

### Interactive Mode
```
User (Claude CLI)
    ↓
> /jira-self-hosted
> Summarize yesterday's tasks
    ↓
Claude reads SKILL.md
    ↓
Claude uses skill context
    ↓
jira-search.sh (curl → Jira API)
    ↓
Parse JSON with jq
    ↓
Return to Claude
    ↓
Claude formats response
    ↓
User sees readable summary
```

### Automation Mode
```
Cron Scheduler (8 AM Vietnam = 1 AM UTC)
    ↓
run-daily-report.sh
    ├─ Load .env.dev or .env
    └─ node daily-report.mjs (retry 3x)
        ↓
    runClaudeCode(DAILY_PROMPT)
        ├─ Spawn: claude -p
        ├─ Prompt includes 3-step JQL
        └─ Claude uses /jira-self-hosted skill
            ↓
        jira-search.sh (yesterday's issues)
        jira-search.sh (team members)
        Parse and aggregate
            ↓
        Return formatted report (📊 HTML)
        ↓
    Success path:
    sendTelegramMessage(TELEGRAM_GROUP_CHAT_ID)
        ↓
    Cron completes ✅

    Error path:
    sendTelegramMessage(TELEGRAM_CHAT_ID, error)
        ↓
    Cron logs failure ❌
```

---

## Key Interfaces & Contracts

### Skill Interface (SKILL.md → Claude)

**Input:** User prompt with jira-self-hosted context
**Output:** Helper scripts available (jira-search.sh, jira-issue-get.sh, jira-auth-test.sh)
**Error Handling:** curl returns error JSON, Claude interprets

### API Contract (Scripts → Jira)

**Authentication:** Bearer token in Authorization header
**Request:** POST /search with JQL + field array
**Response:** JSON with issues array (key, summary, status, assignee, priority)
**Pagination:** startAt, maxResults, total fields
**Error:** 401 = invalid PAT, 404 = issue not found

### Telegram Contract (daily-report.mjs → Bot)

**Endpoint:** https://api.telegram.org/bot{TOKEN}/sendMessage
**Body:** JSON with chat_id, text, parse_mode=HTML, message_thread_id (optional)
**Success:** 200 OK + "ok": true
**Limit:** 4096 chars per message (split required)

---

## Dependencies

| Dependency | Version | Usage | Source |
|------------|---------|-------|--------|
| Node.js | 18+ | Spawn child processes | System |
| Claude CLI | Latest | Interactive + automation | System |
| curl | Any | HTTP requests to Jira | System |
| jq | 1.6+ | JSON parsing | System |
| Jira | 8.14.0+ | REST API v2 + PAT | External |
| Telegram Bot | N/A | Message delivery | External |

**Install Check:**
```bash
node --version         # Must be 18+
claude --version       # Must be installed
which curl && which jq # Must be in PATH
```

---

## Code Quality Metrics

| Metric | Value | Target |
|--------|-------|--------|
| **Total LOC** | ~830 | < 1000 |
| **Average File Size** | 55 LOC | < 200 LOC |
| **Largest File** | README.md (551 LOC) | < 800 LOC |
| **Scripts** | 8 files | ✅ |
| **Documentation** | 4 references | ✅ |
| **Error Handling** | Retry logic present | ✅ |
| **Security** | PAT in .env only | ✅ |

---

## Configuration Flexibility

### Team-Specific Customization

**Without Code Changes:**
```javascript
// Edit daily-report.mjs top section:
JIRA_PROJECTS = ["YOUR-PROJ-1", "YOUR-PROJ-2"]
MAIN_PROJECT = "YOUR-PROJ-1"
EXCLUDED_USERS = ["Bot Name", "Automation User"]
JIRA_STATUSES = {
  done: "Closed",           // Your custom names
  resolved: "Dev Complete",
  testing: "QA Testing",
  inProgress: "In Development",
  toDo: "Backlog"
}
```

### Workflow Adaptation

Edit `SKILL.md` "Defect Detection Logic" section:
```markdown
### Custom Defect Definition
- Bug type issues
- Transitions from Testing → [custom status] (QC Reject)
- Issues reopened from Done
```

---

## Performance Characteristics

| Operation | Typical Time | Limit |
|-----------|--------------|-------|
| PAT validation | 200ms | N/A |
| JQL search (50 issues) | 500ms | maxResults=100 |
| Get issue details | 300ms | N/A |
| Daily report generation | 3-4 minutes | 5 minute timeout |
| Telegram message send | 100ms | 4096 chars limit |

**Scaling:**
- 500+ team members → query paginated (100 per request)
- 1000+ daily issues → paginate across multiple requests
- Report message → split into 4096 char chunks

---

## Security Posture

| Aspect | Implementation | Verification |
|--------|---|---|
| **PAT Storage** | .env file (excluded from git) | Check .gitignore |
| **Authentication** | Bearer token in header | curl -H "Authorization: Bearer..." |
| **API Access** | Read-only (no POST/PUT/DELETE) | No create/update endpoints used |
| **Data Handling** | No caching, memory-only | No database or file writes |
| **Logging** | Request URIs only (no params) | Check log files |
| **Telegram** | Token in .env only | Check process environment |

---

## Testing & Validation

**Manual Testing:**
```bash
# Test Jira connection
~/.claude/skills/jira-self-hosted/scripts/jira-auth-test.sh

# Test JQL query
~/.claude/skills/jira-self-hosted/scripts/jira-search.sh 'project = PSV2 AND status = "In Progress"'

# Test issue lookup
~/.claude/skills/jira-self-hosted/scripts/jira-issue-get.sh PROJ-123

# Test daily report (dry run)
node daily-report.mjs
```

**Cron Testing:**
```bash
# Simulate cron environment
env -i HOME=$HOME /bin/sh -c 'source .env && ./run-daily-report.sh'
```

---

## Related Documentation

- **Project Overview & PDR:** [./project-overview-pdr.md](./project-overview-pdr.md)
- **System Architecture:** [./system-architecture.md](./system-architecture.md)
- **Code Standards:** [./code-standards.md](./code-standards.md)
- **Development Roadmap:** [./development-roadmap.md](./development-roadmap.md)
- **Main README:** [../README.md](../README.md)
