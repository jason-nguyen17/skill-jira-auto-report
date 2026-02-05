# Project Overview & Product Development Requirements

**Project:** skill-jira-auto-report
**Version:** 1.0.0
**Last Updated:** 2026-02-05
**License:** MIT

## Project Overview

### Purpose

skill-jira-auto-report is a Claude Code skill that automates Jira reporting and Telegram notifications. It enables two primary use cases:

1. **Interactive Q&A** - Ask Claude natural language questions about Jira data (Vietnamese/English)
2. **Automated Daily Reports** - Scheduled cron jobs that generate and send daily team activity reports via Telegram

### Target Users

- **Dev Teams** using Jira Server/Data Center for project management
- **Team Leads** tracking team productivity and task status
- **QA Leads** monitoring defects and testing progress

### Key Features

| Feature | Details |
|---------|---------|
| **Jira Query** | REST API v2 with PAT authentication (read-only) |
| **JQL Support** | Full JQL query syntax for complex searches |
| **Natural Language** | Vietnamese/English prompts via Claude |
| **Daily Reports** | Automated cron-based scheduling |
| **Telegram Integration** | Success/error notifications with formatting |
| **Team Analytics** | Task counts by person, status breakdown, defect tracking |

### Platform Support

- **Jira:** Server v8.14.0+ or Data Center (requires PAT support)
- **Runtime:** Node.js 18+
- **CLI:** Claude Code (latest)
- **Telegram:** Bot API

### Current Scope

**In Scope (READ-only):**
- Search issues via JQL
- View issue details (summary, status, assignee, comments)
- List projects
- Query team members
- Generate daily reports

**Out of Scope:**
- Create/update/delete issues
- Modify workflows
- User management
- Jira Cloud support

---

## Product Development Requirements (PDR)

### 1. Functional Requirements

#### 1.1 Jira Integration

**REQ-101:** Query Interface
The system SHALL support querying Jira via REST API v2 with PAT authentication.
- Accept JQL queries
- Support field selection (key, summary, status, assignee, priority, etc.)
- Handle pagination for large result sets (maxResults=100)
- **Acceptance:** curl commands execute successfully, jq parsing works

**REQ-102:** Issue Operations
The system SHALL perform read-only operations on issues.
- Get issue by key (PROJ-123)
- Retrieve issue comments
- Extract assignee and status information
- **Acceptance:** All fields parse correctly, no data loss

**REQ-103:** Project Querying
The system SHALL list accessible projects and team members.
- GET /project (list all projects)
- GET /user/assignable/search?project=PROJ (team members)
- Support maxResults parameter for pagination
- **Acceptance:** API responses parse without error

#### 1.2 Skill Interface

**REQ-201:** Claude Integration
The system SHALL integrate as a Claude Code skill.
- Execute via `/jira-self-hosted` command
- Support natural language prompts
- Pass queries to helper scripts
- Return formatted results to Claude
- **Acceptance:** Claude processes skill requests, helper scripts execute

**REQ-202:** Helper Scripts
The system SHALL provide bash wrapper scripts.
- `jira-auth-test.sh` - Validate PAT connection
- `jira-search.sh "JQL"` - Execute JQL queries
- `jira-issue-get.sh KEY` - Get issue details
- **Acceptance:** Scripts execute, parse JSON, handle errors gracefully

#### 1.3 Daily Report Automation

**REQ-301:** Scheduled Execution
The system SHALL generate daily reports via cron jobs.
- Spawn Claude CLI with configured prompt
- Query Jira for issues updated yesterday
- Generate formatted report
- Send success/error notifications
- **Acceptance:** Cron job runs, report sends within 5-minute timeout

**REQ-302:** Report Content
Daily reports SHALL include:
- Task breakdown by status (Done, Resolved, Testing, In Progress)
- Tasks grouped by assignee
- Defect detection (bug type + QC rejects)
- Inactive team members (no tasks yesterday)
- **Acceptance:** Report contains all sections, accurate counts

**REQ-303:** Telegram Notifications
The system SHALL send formatted messages via Telegram.
- Success reports → group chat
- Errors → private chat
- Support thread IDs (topics)
- Respect Telegram 4096 char limit (message splitting)
- **Acceptance:** Messages arrive with correct formatting, no truncation

#### 1.4 Configuration

**REQ-401:** Environment Variables
The system SHALL support two .env files.
- Project root `.env` → Telegram config (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
- Skill folder `.env` → Jira config (JIRA_DOMAIN, JIRA_PAT)
- Priority: `.env.dev` > `.env` for development
- **Acceptance:** Both files load without error, variables accessible

**REQ-402:** Customization
The system SHALL allow runtime configuration.
- JIRA_PROJECTS - List of project keys to track
- MAIN_PROJECT - Team member query source
- EXCLUDED_USERS - Users to exclude from reports
- JIRA_STATUSES - Status name mapping for custom workflows
- **Acceptance:** Config changes reflect in report output

---

### 2. Non-Functional Requirements

#### 2.1 Security

**REQ-501:** Authentication
- PAT stored in `.env` file (never in code or logs)
- Bearer token format: `Authorization: Bearer {PAT}`
- No credential logging or console output
- **Acceptance:** PAT not visible in process output or logs

**REQ-502:** Data Protection
- Read-only API access (no create/update/delete)
- API responses contain only queried data (no injection)
- No data caching or disk storage beyond config
- **Acceptance:** API errors don't expose sensitive info

**REQ-503:** Access Control
- Jira validates PAT for each request
- Bot token restricted to group/private chat
- Daily reports visible to configured group only
- **Acceptance:** Unauthorized requests rejected, access logs clean

#### 2.2 Performance

**REQ-601:** Response Time
- Jira API queries complete within 10 seconds
- Daily report generation within 5-minute timeout
- JQL searches with pagination handle up to 1000 issues
- **Acceptance:** No timeout errors in 95th percentile

**REQ-602:** Scalability
- Support projects with 500+ team members
- Handle pagination for large issue sets
- Message splitting for Telegram (4096 char limit)
- **Acceptance:** No data loss, reports complete within timeout

#### 2.3 Reliability

**REQ-701:** Error Handling
- Retry failed API calls (3 attempts)
- Graceful degradation on Telegram errors
- Clear error messages in logs and notifications
- **Acceptance:** Errors logged with context, retry executes

**REQ-702:** Logging
- Log all API requests and responses (non-sensitive)
- Record daily report execution (success/failure)
- Write to cron log file with timestamp
- **Acceptance:** logs/ directory contains dated entries

#### 2.4 Maintainability

**REQ-801:** Code Quality
- Clear separation: skill scripts, daily report script, config
- Helper scripts are reusable and testable
- Configuration centralized in SKILL.md and daily-report.mjs
- **Acceptance:** Code is <200 LOC per file, well-commented

**REQ-802:** Documentation
- Inline comments for complex logic
- SKILL.md explains when/how to use skill
- References/ folder guides for JQL, API, authentication
- README.md includes quick start and troubleshooting
- **Acceptance:** New dev can run project in <30 minutes

---

### 3. Acceptance Criteria

#### 3.1 Feature Completeness

- [ ] Jira REST API v2 queries execute successfully
- [ ] JQL parsing handles complex syntax (operators, date functions)
- [ ] Helper scripts return formatted JSON output
- [ ] Claude skill recognizes `/jira-self-hosted` command
- [ ] Daily report contains all 5 sections (summary, by person, details, defects, notes)
- [ ] Telegram sends formatted messages to correct chat ID
- [ ] Cron job runs daily without intervention

#### 3.2 Configuration Flexibility

- [ ] JIRA_PROJECTS can be customized without code changes
- [ ] JIRA_STATUSES adapts to custom workflow names
- [ ] EXCLUDED_USERS prevents incorrect user attribution
- [ ] Development mode (.env.dev) works without affecting .env
- [ ] Report format customizable via DAILY_PROMPT

#### 3.3 Security & Privacy

- [ ] PAT never appears in logs, console, or error messages
- [ ] API requests use Bearer authentication
- [ ] Telegram bot token never exposed
- [ ] Reports visible only to configured recipients
- [ ] API access is read-only (no create/update)

#### 3.4 Performance & Reliability

- [ ] Daily report completes within 5 minutes
- [ ] Handles projects with 500+ team members
- [ ] Cron failures are logged and notified
- [ ] Retry logic executes 3 times on transient errors
- [ ] Message splitting prevents Telegram truncation

#### 3.5 Documentation & Maintainability

- [ ] README covers both Vietnamese and English
- [ ] SKILL.md explains skill interface and defect logic
- [ ] References/ folder covers authentication, API, JQL, best practices
- [ ] Code comments explain non-obvious logic
- [ ] Installation script is idempotent (safe to run multiple times)

---

### 4. Technical Architecture

#### 4.1 Component Diagram

```
┌─────────────────────────────────────────────┐
│         Claude Code CLI (Interactive)       │
└────────────┬────────────────────────────────┘
             │
             │ /jira-self-hosted skill
             ▼
┌─────────────────────────────────────────────┐
│      Jira Skill (skills/jira-self-hosted/)  │
│  ┌──────────────────────────────────────┐   │
│  │ SKILL.md (interface definition)      │   │
│  ├──────────────────────────────────────┤   │
│  │ scripts/ (bash wrappers)             │   │
│  │  • jira-auth-test.sh                 │   │
│  │  • jira-search.sh                    │   │
│  │  • jira-issue-get.sh                 │   │
│  ├──────────────────────────────────────┤   │
│  │ references/ (documentation)          │   │
│  │  • api-reference.md                  │   │
│  │  • jql-guide.md                      │   │
│  │  • authentication.md                 │   │
│  └──────────────────────────────────────┘   │
└────────────┬────────────────────────────────┘
             │
             │ curl + jq
             ▼
┌──────────────────────────────────────────┐
│  Jira Server/Data Center REST API v2     │
│  (PAT Authentication)                    │
└──────────────────────────────────────────┘


┌─────────────────────────────────────────────┐
│        Daily Report Automation              │
└────────────┬────────────────────────────────┘
             │
             │ cron job (daily)
             ▼
┌──────────────────────────────────────────┐
│  run-daily-report.sh                     │
│  (env loading, retry logic)              │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  daily-report.mjs (Node.js)              │
│  (spawn Claude CLI, collect data)        │
└────────────┬─────────────────────────────┘
             │
  ┌──────────┴──────────┐
  ▼                     ▼
Jira API            Claude CLI
(historical data)    (NLP processing)
  │                     │
  └──────────┬──────────┘
             ▼
     ┌─────────────────┐
     │ Formatted Report│
     └────────┬────────┘
              │
              ▼
     ┌─────────────────┐
     │ Telegram Bot    │
     │ (success/error) │
     └─────────────────┘
```

#### 4.2 Data Flow

1. **Interactive Mode:**
   - User prompts Claude with natural language
   - Claude invokes `/jira-self-hosted` skill
   - Skill scripts execute curl → Jira API
   - Results parsed by jq, returned to Claude
   - Claude formats and responds to user

2. **Automation Mode:**
   - Cron triggers `run-daily-report.sh`
   - Script loads .env variables
   - Node.js spawns `claude` CLI with prompt
   - Claude uses skill to query Jira (yesterday's data)
   - Report generated, split for Telegram
   - Success → group chat, Error → private chat

---

### 5. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Availability** | 99.5% | Monthly cron success rate |
| **Response Time** | <10s | Jira API query latency (p95) |
| **Report Completeness** | 100% | All 5 sections present, no data loss |
| **Defect Detection** | 95%+ | Bug type + QC reject accuracy |
| **Team Coverage** | 100% | All team members appear in report |

---

### 6. Constraints & Assumptions

**Constraints:**
- Jira Server/Data Center only (no Cloud support)
- PAT authentication (no username/password)
- Node.js 18+ required for daily reports
- Claude Code CLI must be authenticated on server

**Assumptions:**
- Jira workflow follows: To Do → In Progress → Resolved → Testing → Done
- Team members are assignees in MAIN_PROJECT
- Telegram bot added to group/private chat
- Cron environment has curl, jq, node, claude CLI

---

### 7. Roadmap & Phase Timeline

**Phase 1: Foundation (Completed)**
- Jira REST API v2 integration
- PAT authentication
- Basic helper scripts
- Claude skill interface

**Phase 2: Reporting (Completed)**
- Daily report automation
- Telegram notifications
- Team analytics
- Defect detection logic

**Phase 3: Enhancement (Future)**
- Sprint/version filtering
- Custom report templates
- Slack integration
- Performance metrics dashboard

---

## Related Documents

- **System Architecture:** [./system-architecture.md](./system-architecture.md)
- **Code Standards:** [./code-standards.md](./code-standards.md)
- **Codebase Summary:** [./codebase-summary.md](./codebase-summary.md)
- **Development Roadmap:** [./development-roadmap.md](./development-roadmap.md)
- **Project Changelog:** [./project-changelog.md](./project-changelog.md)
