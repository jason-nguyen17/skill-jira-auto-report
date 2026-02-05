# System Architecture

**Project:** skill-jira-auto-report
**Version:** 1.0.0
**Last Updated:** 2026-02-05

## Architecture Overview

skill-jira-auto-report is a dual-interface system that provides:

1. **Interactive Interface** - Real-time Q&A via Claude Code CLI
2. **Automation Interface** - Scheduled daily reports via cron jobs

Both interfaces share a common **Jira Query Layer** that abstracts REST API v2 operations behind simple bash scripts.

```
┌─────────────────────────────────────────────────────┐
│                  User Interfaces                     │
├──────────────────────┬──────────────────────────────┤
│  Interactive Mode    │     Automation Mode          │
│  (Claude CLI)        │     (Cron Job)               │
└──────────────────────┴──────────────────────────────┘
                      │
          ┌───────────┴────────────┐
          ▼                        ▼
┌──────────────────────┐  ┌──────────────────────┐
│  Skill Interface     │  │  Report Generator    │
│  (SKILL.md)          │  │  (daily-report.mjs)  │
└──────────────────────┘  └──────────────────────┘
          │                        │
          └───────────┬────────────┘
                      ▼
        ┌─────────────────────────┐
        │   Query Abstraction     │
        │   (Bash Scripts)        │
        ├─────────────────────────┤
        │ • jira-auth-test.sh    │
        │ • jira-search.sh       │
        │ • jira-issue-get.sh    │
        └─────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │  Jira REST API v2       │
        │  (PAT Authentication)   │
        ├─────────────────────────┤
        │ • /search (JQL)         │
        │ • /issue/{key}          │
        │ • /project              │
        │ • /comment              │
        └─────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │  Jira Instance          │
        │  Server/Data Center     │
        │  v8.14.0+               │
        └─────────────────────────┘
```

---

## Layer Architecture

### 1. Presentation Layer (User Interfaces)

#### 1.1 Interactive Mode

**Component:** Claude Code CLI + SKILL.md
**Entry Point:** `/jira-self-hosted` command in Claude

**Flow:**
```
User Prompt (natural language)
    ↓
Claude recognizes /jira-self-hosted
    ↓
Claude loads SKILL.md (skill definition)
    ↓
Claude processes prompt with skill context
    ↓
Claude invokes helper scripts as needed
    ↓
Claude parses results
    ↓
Claude formats response
    ↓
Response delivered to user
```

**Characteristics:**
- Real-time interaction
- Natural language processing by Claude
- Ad-hoc queries (not scheduled)
- Flexible output format (Claude decides)

#### 1.2 Automation Mode

**Component:** daily-report.mjs + run-daily-report.sh
**Entry Point:** Cron job (daily scheduled)

**Flow:**
```
Cron triggers run-daily-report.sh (8 AM Vietnam time)
    ↓
Load .env/.env.dev variables
    ↓
Spawn node daily-report.mjs (with 3 retries)
    ↓
Build DAILY_PROMPT with 3-step JQL queries
    ↓
Spawn Claude CLI with prompt
    ↓
Claude queries Jira (issues from yesterday)
    ↓
Claude generates formatted report (📊 HTML)
    ↓
Split message for Telegram (4096 char limit)
    ↓
Send via Telegram Bot API
    │
    ├─→ Success: send to TELEGRAM_GROUP_CHAT_ID
    └─→ Error: send to TELEGRAM_CHAT_ID (private)
```

**Characteristics:**
- Scheduled execution (daily)
- Structured report format
- Telegram notifications
- Error handling with retries

---

### 2. Skill Layer (Jira Integration Interface)

#### SKILL.md - Skill Definition

**Purpose:** Define skill interface for Claude Code CLI

**Key Sections:**
```markdown
---
name: jira-self-hosted
description: Query Jira Server/Data Center via REST API v2
version: 1.0.0
license: MIT
allowed-tools:
  - Bash
---

# Jira Self-Hosted (Server/Data Center)

When to Use:
- Searching issues with JQL
- Viewing issue details
- Listing projects
- Reading comments

Quick Reference:
- Helper Scripts (what Claude can call)
- References (documentation for Claude to understand)

Environment Setup:
- JIRA_DOMAIN
- JIRA_PAT

Implementation Workflow:
- Step-by-step for Claude to follow

Defect Detection Logic:
- Bug type definition
- QC Reject definition
```

**Dual Purpose:**
1. **For Claude:** Explains what the skill does, when to use it, what tools are available
2. **For Users:** Documents the skill interface, provides reference links

**Knowledge Base:** References folder serves as Claude's knowledge base for:
- Authentication methods (API docs)
- API endpoints (REST reference)
- JQL syntax (query guide)
- Best practices (performance, security)

---

### 3. Query Abstraction Layer (Bash Scripts)

Helper scripts provide a clean interface between high-level requests (Claude, daily-report.mjs) and low-level API calls (curl → Jira).

#### 3.1 jira-auth-test.sh

**Purpose:** Validate PAT and Jira connection

**API Endpoint:** GET /rest/api/2/myself
**Input:** None (reads JIRA_DOMAIN, JIRA_PAT from .env)
**Output:** JSON with user information or error
**Exit Code:** 0 = success, 1 = error

**Responsibility:**
- Load environment
- Validate required vars
- Construct curl request
- Parse response with jq
- Return status

---

#### 3.2 jira-search.sh

**Purpose:** Execute JQL queries and return matching issues

**API Endpoint:** POST /rest/api/2/search
**Input:** JQL query string (argument 1)
**Output:** JSON array of issues
**Exit Code:** 0 = success, 1 = error

**Abstraction Benefits:**
- Hides curl complexity
- Handles authentication (Bearer token)
- Specifies field selection automatically
- Limits maxResults to 100 (pagination-safe)
- Parses JSON with jq
- Returns clean array (not full response object)

**Example Usage:**
```bash
./jira-search.sh 'project = PSV2 AND updated >= startOfDay(-1)'
# Returns: [{"key": "PSV2-123", "summary": "...", ...}, ...]
```

---

#### 3.3 jira-issue-get.sh

**Purpose:** Fetch full details of specific issue

**API Endpoint:** GET /rest/api/2/issue/{key}
**Input:** Issue key (argument 1, e.g., PROJ-123)
**Output:** Full issue JSON with comments
**Exit Code:** 0 = success, 1 = error

**Responsibility:**
- Parse key argument
- Load environment
- Request specific fields (summary, status, assignee, comments, etc.)
- Return parsed JSON

---

### 4. API Layer (Jira REST API v2)

#### 4.1 Endpoints Used

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/search` | POST | Query issues via JQL | Bearer |
| `/issue/{key}` | GET | Get issue details | Bearer |
| `/issue/{key}/comment` | GET | List issue comments | Bearer |
| `/project` | GET | List projects | Bearer |
| `/user/assignable/search` | GET | List assignable users | Bearer |
| `/myself` | GET | Get current user info | Bearer |

#### 4.2 Authentication Method

**Type:** PAT (Personal Access Token) - Jira Server/Data Center only

**Header Format:**
```
Authorization: Bearer {JIRA_PAT}
Content-Type: application/json
```

**Token Properties:**
- Created per user in Jira profile
- 64+ character alphanumeric string
- Scoped to creating user (can't create backdoor access)
- Can be revoked immediately
- Never appears in logs (stored in .env)

#### 4.3 Request/Response Contracts

**JQL Search Request:**
```json
{
  "jql": "project = PROJ AND updated >= startOfDay(-1)",
  "startAt": 0,
  "maxResults": 100,
  "fields": ["key", "summary", "status", "assignee", "priority", "updated"]
}
```

**JQL Search Response:**
```json
{
  "startAt": 0,
  "maxResults": 100,
  "total": 42,
  "issues": [
    {
      "key": "PROJ-123",
      "fields": {
        "summary": "Issue title",
        "status": {"name": "In Progress"},
        "assignee": {"displayName": "John Doe"},
        "priority": {"name": "High"},
        "updated": "2026-02-05T10:30:00.000+0000"
      }
    }
  ]
}
```

**Get Issue Response:**
```json
{
  "key": "PROJ-123",
  "fields": {
    "summary": "Issue title",
    "description": "Full description",
    "status": {"name": "In Progress"},
    "assignee": {"displayName": "John Doe"},
    "priority": {"name": "High"},
    "created": "2026-01-15T10:30:00.000+0000",
    "updated": "2026-02-05T10:30:00.000+0000",
    "comment": {
      "comments": [
        {
          "id": "10001",
          "body": "Comment text",
          "author": {"displayName": "Jane Smith"},
          "created": "2026-01-20T14:45:00.000+0000"
        }
      ]
    }
  }
}
```

#### 4.4 Error Responses

**HTTP 401 Unauthorized** (Invalid/Expired PAT)
```json
{
  "errorMessages": ["Unauthorized"],
  "errors": {}
}
```

**HTTP 400 Bad Request** (Invalid JQL)
```json
{
  "errorMessages": ["Error in the JQL Query: expected = or ~ (Lexical error)"],
  "errors": {}
}
```

**HTTP 404 Not Found** (Issue doesn't exist)
```json
{
  "errorMessages": ["Issue does not exist or you do not have permission to see it"],
  "errors": {}
}
```

---

### 5. Integration Layer (Daily Report)

#### 5.1 run-daily-report.sh

**Responsibility:** Environment preparation and retry logic

**Flow:**
1. Check if Node.js installed
2. Load `.env.dev` (if exists) or `.env` (production)
3. Export all variables as environment
4. Retry loop (3 attempts, 5 second delay):
   - Spawn `node daily-report.mjs`
   - Check exit code
   - If success (0), exit
   - If failure, wait 5s and retry
5. Exit with final status code

**Why Separate Script:**
- Shell handles environment loading better
- Retry logic is simpler in shell
- Easy to test independently
- Clear separation of concerns

---

#### 5.2 daily-report.mjs

**Responsibility:** Orchestrate data collection and delivery

**Configuration Section (Lines 1-31):**
```javascript
const JIRA_PROJECTS = ["PSV2", "DIC", "DEPOT", "AVA"];  // Projects
const MAIN_PROJECT = "PSV2";                             // Team source
const EXCLUDED_USERS = ["Jira Automation"];              // Skip
const JIRA_STATUSES = {                                  // Custom statuses
  done: "Done",
  resolved: "Resolved",
  testing: "Testing",
  inProgress: "In Progress",
  toDo: "To Do"
};
```

**Telegram Configuration (Lines 32-38):**
```javascript
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;        // Private (errors)
const TELEGRAM_GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID;  // Group (reports)
const TELEGRAM_GROUP_THREAD_ID = process.env.TELEGRAM_GROUP_THREAD_ID;  // Optional
```

**DAILY_PROMPT Structure:**
```
[CRITICAL INSTRUCTION] Output starts with 📊 (emoji requirement)

BƯỚC 1 - LẤY TEAM MEMBERS:
Query /user/assignable/search for MAIN_PROJECT

BƯỚC 2 - LẤY ISSUES HÔM QUA:
JQL: project IN (projects) AND updated >= startOfDay(-1)

BƯỚC 3 - XÁC ĐỊNH NGƯỜI KHÔNG HOẠT ĐỘNG:
Compare team members with issue assignees

FORMAT:
📊 <b>BÁO CÁO JIRA</b>
<b>TỔNG QUAN</b>
<b>THEO NGƯỜI</b>
<b>CHI TIẾT DONE</b>
<b>CHI TIẾT RESOLVED</b>
<b>CHI TIẾT TESTING</b>
<b>CHI TIẾT IN PROGRESS</b>
<b>🐛 BUG/REOPEN/REJECT</b>
<b>GHI CHÚ</b>
```

**Main Flow:**
1. Build DAILY_PROMPT with configuration
2. Call `runClaudeCode(prompt)` - spawn Claude CLI
3. Claude processes prompt:
   - Reads prompt and SKILL.md
   - Understands 3-step workflow
   - Calls jira-search.sh for step 1 (team members)
   - Calls jira-search.sh for step 2 (yesterday's issues)
   - Performs step 3 (identify inactive members)
   - Generates formatted report
4. Parse Claude output (validate 📊 emoji, extract text)
5. Split message for Telegram (max 4096 chars)
6. Send via Telegram Bot API:
   - Success → TELEGRAM_GROUP_CHAT_ID
   - Error → TELEGRAM_CHAT_ID

---

### 6. External Integrations

#### 6.1 Jira Integration

**Type:** REST API v2
**Authentication:** Personal Access Token (Bearer)
**Operations:** Read-only (GET, POST for search)
**Data:** Issues, projects, team members, comments
**Frequency:** Interactive (on-demand) + Daily (1x per day)

#### 6.2 Telegram Integration

**Type:** Bot API
**Authentication:** Bot token (in URL)
**Operations:** Send message (POST)
**Data:** Daily report text (HTML formatted)
**Endpoint:** `https://api.telegram.org/bot{TOKEN}/sendMessage`

**Request Body:**
```json
{
  "chat_id": "-100123456789",
  "text": "📊 <b>BÁO CÁO JIRA</b>...",
  "parse_mode": "HTML",
  "message_thread_id": 123
}
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "message_id": 12345,
    "chat": {"id": -100123456789},
    "date": 1707136200,
    "text": "📊 <b>BÁO CÁO JIRA</b>..."
  }
}
```

---

## Data Flow Sequences

### Sequence 1: Interactive Q&A

```
User                Claude CLI          Skill            Scripts           Jira
  │                   │                  │                  │               │
  ├─ "Show me bugs"──→ │                  │                  │               │
  │                   │                  │                  │               │
  │                   ├─ Load SKILL.md ──→ │                  │               │
  │                   │                  │                  │               │
  │                   ├─ Recognize /jira-self-hosted       │               │
  │                   │                  │                  │               │
  │                   ├─ Process prompt ──→ │                  │               │
  │                   │                  │                  │               │
  │                   │                  ├─ Call jira-search.sh             │
  │                   │                  │                  ├─ POST /search ─→
  │                   │                  │                  │               │
  │                   │                  │                  │  ← JSON array ┤
  │                   │                  │  ← JSON parsed    │               │
  │                   │                  ← Parsed data       │               │
  │                   │                  │                  │               │
  │                   ├─ Format response │                  │               │
  │                   │                  │                  │               │
  │  ← "Found 3 bugs" │                  │                  │               │
  │                   │                  │                  │               │
```

### Sequence 2: Automated Daily Report

```
Cron                run-script          daily-report.mjs    Claude         Jira    Telegram
  │                   │                    │                 │              │         │
  ├─ 8 AM Vietnam ────→ │                    │                 │              │         │
  │                   │                    │                 │              │         │
  │                   ├─ Load .env/dev      │                 │              │         │
  │                   │                    │                 │              │         │
  │                   ├─ Retry loop (3x)    │                 │              │         │
  │                   │                    │                 │              │         │
  │                   ├─ Spawn node ───────→ │                 │              │         │
  │                   │                    │                 │              │         │
  │                   │                    ├─ Build prompt    │              │         │
  │                   │                    │                 │              │         │
  │                   │                    ├─ Spawn Claude ──→ │              │         │
  │                   │                    │                 │              │         │
  │                   │                    │                 ├─ jira-search ─→        │
  │                   │                    │                 │              │         │
  │                   │                    │                 │  ← issues    │         │
  │                   │                    │                 │              │         │
  │                   │                    │                 ├─ aggregate   │         │
  │                   │                    │                 │              │         │
  │                   │                    │  ← report (📊)   │              │         │
  │                   │                    │                 │              │         │
  │                   │                    ├─ Parse output    │              │         │
  │                   │                    │                 │              │         │
  │                   │                    ├─ Split message   │              │         │
  │                   │                    │                 │              │         │
  │                   │                    ├─ Send Telegram ──────────────────────────→ │
  │                   │                    │                 │              │         │
  │                   │                    │                 │              │  ← 200 OK
  │                   │                    │                 │              │         │
  │                   │  ← exit code 0      │                 │              │         │
  │                   │                    │                 │              │         │
  │  ← Success        │                    │                 │              │         │
  │                   │                    │                 │              │         │
```

---

## Component Interactions

### 1. Skill Context Loading

When Claude invokes `/jira-self-hosted`:
1. Claude reads SKILL.md from skill directory
2. SKILL.md includes references to documentation:
   - api-reference.md (endpoints)
   - jql-guide.md (query syntax)
   - authentication.md (token setup)
   - best-practices.md (tips)
3. Claude loads these into context
4. Claude understands:
   - What operations are available
   - How to construct JQL queries
   - When to use each helper script
   - How to handle errors

### 2. Script Invocation

Claude can invoke helper scripts:
```bash
./jira-search.sh 'JQL_QUERY'
./jira-issue-get.sh PROJ-KEY
./jira-auth-test.sh
```

Scripts handle:
- Environment loading (.env files)
- Authentication (Bearer token)
- API request construction (curl)
- Response parsing (jq)
- Error handling (exit codes)

### 3. Daily Report Orchestration

daily-report.mjs coordinates:
1. Configuration loading (JIRA_PROJECTS, EXCLUDED_USERS, etc.)
2. Prompt construction (3-step JQL workflow)
3. Claude spawning (run Claude CLI as subprocess)
4. Output parsing (extract report from Claude response)
5. Message delivery (split and send via Telegram)

---

## Configuration Management

### Two-File Configuration Pattern

**Jira Configuration** (skill folder)
```bash
~/.claude/skills/jira-self-hosted/.env
JIRA_DOMAIN="https://jira.example.com"
JIRA_PAT="personal-access-token-here"
```

**Telegram Configuration** (project root)
```bash
./.env
TELEGRAM_BOT_TOKEN="123456:ABC..."
TELEGRAM_CHAT_ID="123456789"
TELEGRAM_GROUP_CHAT_ID="-100123456789"
TELEGRAM_GROUP_THREAD_ID="123"
```

**Rationale:**
- Jira config shared by all users (installed per-user)
- Telegram config team-specific (in project)
- Clear separation of concerns
- Easy to customize for different teams

### Runtime Configuration (daily-report.mjs)

```javascript
const JIRA_PROJECTS = ["PSV2", "DIC"];        // Which projects to track
const MAIN_PROJECT = "PSV2";                   // Where to find team members
const EXCLUDED_USERS = ["Jira Automation"];    // Who to ignore
const JIRA_STATUSES = {                        // Status name mapping
  done: "Done",
  resolved: "Resolved",
  testing: "Testing",
  inProgress: "In Progress",
  toDo: "To Do"
};
```

**Customization:**
- Edit daily-report.mjs to change report behavior
- No need to restart anything (applied next cron run)
- Edit SKILL.md to change defect detection logic

---

## Security Architecture

### PAT-Based Authentication

**Properties:**
- Token is unique per user
- Can be revoked individually
- Never transmitted in plain text (HTTPS only)
- Stored in .env (excluded from git)
- Used only in Authorization header

**Threats Mitigated:**
- Credential theft (not hardcoded)
- Token leakage (not in logs)
- Unauthorized access (PAT per user)

### Read-Only API Access

**API Operations:**
- GET /search (read issues)
- GET /issue/{key} (read details)
- GET /project (read projects)
- No POST/PUT/DELETE (no create/update/delete)

**Benefits:**
- Limited blast radius if credentials compromised
- Safe for automation (can't accidentally modify)
- Audit trail shows only reads

### Telegram Bot Token Protection

**Token Handling:**
- Stored in .env (excluded from git)
- Used only in API requests
- Never logged or printed
- Scope: only sendMessage (no admin rights)

---

## Failure Modes & Recovery

### Jira API Failure

**Transient Error** (500, timeout):
- retry-logic in run-daily-report.sh (3 attempts)
- 5-second delay between attempts
- Log each attempt

**Authentication Error** (401):
- Error message sent to TELEGRAM_CHAT_ID (private)
- Include "Invalid PAT" hint
- Manual intervention required (fix token)

**Permission Error** (403):
- Error message sent to private chat
- User may not have access to project
- Manual intervention required

**Bad Request** (400):
- Usually bad JQL syntax
- Claude may retry with different query
- If persistent, error sent to private chat

### Telegram API Failure

**Transient Error** (500, timeout):
- Logged in cron output
- run-daily-report.sh retries
- If all 3 attempts fail, cron logs failure

**Auth Error** (401):
- Invalid bot token
- Error logged and sent to stderr
- Manual token update required

**Rate Limit** (429):
- Telegram rate limited our bot
- Rare for daily reports
- Logged, cron retries next day

### Claude CLI Failure

**Timeout** (>5 minutes):
- Process killed by timer
- Error logged: "Claude execution timeout"
- Retried by run-daily-report.sh

**Crash** (exit code != 0):
- run-daily-report.sh captures exit code
- Retries up to 3 times
- If persistent, error sent to Telegram

**Skill Error** (Claude can't invoke script):
- Claude returns error message
- daily-report.mjs detects missing 📊 emoji
- Error sent to TELEGRAM_CHAT_ID

---

## Performance Characteristics

### Latency

| Component | Typical Time | Bottleneck |
|-----------|--------------|-----------|
| Jira auth validation | 200ms | Network |
| JQL search (50 issues) | 500ms | Jira API |
| Team member query | 300ms | Jira API |
| Claude processing | 2-3 min | LLM inference |
| Telegram send | 100ms | Network |
| **Total Daily Report** | 3-4 min | Claude |

### Throughput

- **Team Size:** Supports 500+ members (paginated queries)
- **Daily Issues:** Handles 1000+ issues (paginated)
- **Projects:** Unlimited (queried serially)
- **Report Size:** Up to 4096 chars per message (split into multiple messages)

### Resource Usage

- **CPU:** Low (I/O bound on API calls)
- **Memory:** ~50MB (Node.js + Claude CLI)
- **Disk:** <1MB (logs per execution, rotated)
- **Network:** ~10KB per query (depends on result size)

---

## Monitoring & Observability

### Logging Points

1. **run-daily-report.sh:**
   - Script start/end
   - Node process start/end
   - Retry attempts and delays
   - Exit codes

2. **daily-report.mjs:**
   - Claude process spawn
   - Prompt sent to Claude
   - Claude output received
   - Telegram request/response
   - Errors with context

3. **Helper Scripts:**
   - API request sent (URL, headers - no token)
   - API response received
   - Errors with HTTP code and message

### Log Format

```
[2026-02-05T08:00:00Z] Starting daily report
[2026-02-05T08:00:05Z] Claude spawned (PID 1234)
[2026-02-05T08:03:45Z] Claude output received (3456 bytes)
[2026-02-05T08:03:50Z] Telegram request: chat_id=-100123456789
[2026-02-05T08:03:51Z] Telegram response: ok=true
[2026-02-05T08:03:51Z] Report sent successfully
```

### Metrics to Track

- Daily report success rate (%)
- Average execution time (minutes)
- API error rate (%)
- Team member coverage (%)
- Defect detection accuracy (%)

---

## Extensibility Points

### Adding New Data Sources

**Current:** Jira-only
**Future:** Add Slack, GitHub, GitLab

**Extension Point:** daily-report.mjs `DAILY_PROMPT`
- Add new step to prompt
- Claude queries additional APIs via new skills
- Aggregate results into single report

### Adding New Report Formats

**Current:** HTML (Telegram)
**Future:** Markdown, PDF, Email

**Extension Point:** daily-report.mjs message sending
- Parse Claude output differently
- Format for target medium
- Use appropriate API (sendMessage vs email)

### Custom Defect Detection

**Current:** Bug type + QC Reject
**Future:** Customize per team

**Extension Point:** SKILL.md `Defect Detection Logic`
- Edit section to change detection rules
- Claude reads and applies logic
- No code changes needed

---

## Related Documents

- **Project Overview & PDR:** [./project-overview-pdr.md](./project-overview-pdr.md)
- **Code Standards:** [./code-standards.md](./code-standards.md)
- **Codebase Summary:** [./codebase-summary.md](./codebase-summary.md)
- **Development Roadmap:** [./development-roadmap.md](./development-roadmap.md)
