# skill-jira-auto-report

**English below**

🤖 Claude Code skill để tạo báo cáo Jira tự động và gửi qua Telegram.

**Chỉ hỗ trợ Jira Server/Data Center** (Self-Hosted) với PAT authentication.

**[Đầy đủ Tài liệu →](./docs)**

---

## 🚀 Cách sử dụng chính: Hỏi đáp qua Claude Code CLI

**Đây là cách sử dụng chính và đơn giản nhất.**

Sau khi cài đặt skill, bạn có thể hỏi Claude bất kỳ điều gì về Jira:

```bash
claude
> Tổng hợp task của team hôm qua
> Ai đang làm gì trong project PSV2?
> List các bug chưa fix?
```

Claude tự động sử dụng skill `jira-self-hosted` để query Jira. Không cần nhớ JQL syntax!

---

## ⚡ Nhanh Chóng Bắt Đầu

### Cài đặt (1 phút)

```bash
./install-skill.sh
nano ~/.claude/skills/jira-self-hosted/.env  # Cấu hình Jira
```

### Sử dụng Interactive (Ngay lập tức)

```bash
claude
/jira-self-hosted
> Hỏi gì đó về Jira...
```

### Cài đặt Tự động (Optional, ~5 phút)

```bash
nano .env                    # Cấu hình Telegram
crontab -e                   # Thêm cron job (8 AM)
0 1 * * * /path/to/run-daily-report.sh
```

Xem **[docs/project-overview-pdr.md](./docs/project-overview-pdr.md)** để biết chi tiết.

---

## 📚 Documentation

For detailed information, see the `/docs` directory:

| Document | Content |
|----------|---------|
| [project-overview-pdr.md](./docs/project-overview-pdr.md) | Features, requirements, acceptance criteria |
| [system-architecture.md](./docs/system-architecture.md) | Architecture, data flow, integrations |
| [code-standards.md](./docs/code-standards.md) | Coding conventions, code quality |
| [codebase-summary.md](./docs/codebase-summary.md) | File inventory, component breakdown |
| [development-roadmap.md](./docs/development-roadmap.md) | Phases, timeline, future features |
| [project-changelog.md](./docs/project-changelog.md) | Release history, changes, versioning |

---

## 🔧 Configuration

### Two Configuration Files

| File | Used By | Variables |
|------|---------|-----------|
| `.env` | daily-report.mjs | TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID |
| `~/.claude/skills/jira-self-hosted/.env` | Skill scripts | JIRA_DOMAIN, JIRA_PAT |

### Quick Setup

```bash
# 1. Install skill
./install-skill.sh

# 2. Configure Jira
nano ~/.claude/skills/jira-self-hosted/.env
# Add: JIRA_DOMAIN, JIRA_PAT

# 3. Test connection
~/.claude/skills/jira-self-hosted/scripts/jira-auth-test.sh
```

### Customize (daily-report.mjs)

```javascript
const JIRA_PROJECTS = ["PSV2", "DIC"];  // Projects to track
const MAIN_PROJECT = "PSV2";             // Team member source
const EXCLUDED_USERS = [];               // Users to skip
const JIRA_STATUSES = {                  // Custom status names
  done: "Done",
  resolved: "Resolved",
  testing: "Testing",
  inProgress: "In Progress",
  toDo: "To Do"
};
```

---

## 🤖 Interactive Usage

```bash
claude
> /jira-self-hosted
> Tổng hợp task hôm qua
```

Or simply ask without `/jira-self-hosted`:
```bash
> Ai đang làm gì trong PSV2?
> List các bug chưa fix
> Thống kê done tasks tuần này
```

See [skills/jira-self-hosted/references/](./skills/jira-self-hosted/references/) for JQL syntax and API docs.

---

## ⏰ Automated Reports (Optional)

### Setup Telegram

1. Chat @BotFather → `/newbot` → copy token
2. Add bot to your group/private chat
3. Configure in `.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=123456:ABC...
   TELEGRAM_CHAT_ID=123456789              # For errors
   TELEGRAM_GROUP_CHAT_ID=-100123456789   # For reports
   ```

### Setup Cron

```bash
crontab -e
# Add: 0 1 * * * /path/to/run-daily-report.sh
```

Run at 8 AM Vietnam time (1 AM UTC) daily.

### Monitor

```bash
# Test report locally
./run-daily-report.sh

# Check logs
tail -f daily-report.log
```

See [project-overview-pdr.md](./docs/project-overview-pdr.md) for detailed setup.

---

## 📋 Features

| Feature | Interactive | Automation |
|---------|-------------|-----------|
| **Query Jira** | ✅ Any time | ✅ Daily |
| **JQL Syntax** | Natural language | Configured |
| **Output Format** | Claude's choice | HTML/Telegram |
| **Notifications** | Console | Telegram |

---

## ⚙️ Requirements

- Claude Code CLI (installed & authenticated)
- Jira Server/Data Center v8.14.0+ (PAT support)
- Node.js 18+ (for automation only)
- curl, jq (system commands)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| PAT invalid | Check token in `~/.claude/skills/jira-self-hosted/.env` |
| Jira not found | Verify JIRA_DOMAIN (no trailing slash) |
| Script timeout | Check network, may need to increase TIMEOUT |
| Telegram error | Verify bot token and chat IDs in `.env` |

See [system-architecture.md](./docs/system-architecture.md) for detailed error handling.

---

## 📖 Customization

- **Defect Detection:** Edit `skills/jira-self-hosted/SKILL.md`
- **Report Format:** Edit `DAILY_PROMPT` in `daily-report.mjs`
- **Workflow Names:** Customize `JIRA_STATUSES` in `daily-report.mjs`

See [code-standards.md](./docs/code-standards.md) for conventions.

---

## 🐛 Defect Detection Logic

Báo cáo tự động phân loại bugs dựa trên changelog transitions:

| Pattern | Loại | Giải thích |
|---------|------|------------|
| Testing → Resolved/In Progress/To Do | QC Reject | QC trả về work state |
| Testing → Reopened | Reopen | QC mở lại issue |
| Resolved/Done → Reopened | Reopen | Bug mở lại từ done |
| In Progress → Resolved (Bug type) | Bug Fixed | Dev fix xong |

Chỉnh sửa trong `daily-report.mjs` (DAILY_PROMPT) hoặc `skills/jira-self-hosted/SKILL.md`.

---

## 📄 License

MIT

---

# English Version

🤖 Claude Code skill for automated Jira daily reports sent via Telegram.

**Only supports Jira Server/Data Center** (Self-Hosted) with PAT authentication.

**[Full Documentation →](./docs)**

---

## 🚀 Quick Start

### Install (1 min)

```bash
./install-skill.sh
nano ~/.claude/skills/jira-self-hosted/.env  # Configure Jira
```

### Use Interactive (Instantly)

```bash
claude
> Ask anything about Jira in natural language
```

### Setup Automation (Optional, ~5 min)

```bash
nano .env                  # Configure Telegram
crontab -e                 # Add cron job (8 AM)
0 1 * * * /path/to/run-daily-report.sh
```

See **[docs/project-overview-pdr.md](./docs/project-overview-pdr.md)** for details.

---

## 📚 Documentation

For detailed information, see the `/docs` directory:

| Document | Content |
|----------|---------|
| [project-overview-pdr.md](./docs/project-overview-pdr.md) | Features, requirements, acceptance criteria |
| [system-architecture.md](./docs/system-architecture.md) | Architecture, data flow, integrations |
| [code-standards.md](./docs/code-standards.md) | Coding conventions, code quality |
| [codebase-summary.md](./docs/codebase-summary.md) | File inventory, component breakdown |
| [development-roadmap.md](./docs/development-roadmap.md) | Phases, timeline, future features |
| [project-changelog.md](./docs/project-changelog.md) | Release history, changes, versioning |

---

## 🔧 Configuration

### Two Configuration Files

| File | Used By | Variables |
|------|---------|-----------|
| `.env` | daily-report.mjs | TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID |
| `~/.claude/skills/jira-self-hosted/.env` | Skill scripts | JIRA_DOMAIN, JIRA_PAT |

### Quick Setup

```bash
# 1. Install skill
./install-skill.sh

# 2. Configure Jira
nano ~/.claude/skills/jira-self-hosted/.env
# Add: JIRA_DOMAIN, JIRA_PAT

# 3. Test connection
~/.claude/skills/jira-self-hosted/scripts/jira-auth-test.sh
```

### Customize (daily-report.mjs)

```javascript
const JIRA_PROJECTS = ["PSV2", "DIC"];  // Projects to track
const MAIN_PROJECT = "PSV2";             // Team member source
const EXCLUDED_USERS = [];               // Users to skip
const JIRA_STATUSES = {                  // Custom status names
  done: "Done",
  resolved: "Resolved",
  testing: "Testing",
  inProgress: "In Progress",
  toDo: "To Do"
};
```

---

## 🤖 Interactive Usage

```bash
claude
> Ask anything about Jira in natural language
```

Or use skill explicitly:
```bash
> /jira-self-hosted
> Summarize yesterday's tasks
```

See [skills/jira-self-hosted/references/](./skills/jira-self-hosted/references/) for JQL syntax and API docs.

---

## ⏰ Automated Reports (Optional)

### Setup Telegram

1. Chat @BotFather → `/newbot` → copy token
2. Add bot to group/chat
3. Configure in `.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=123456:ABC...
   TELEGRAM_CHAT_ID=123456789              # For errors
   TELEGRAM_GROUP_CHAT_ID=-100123456789   # For reports
   ```

### Setup Cron

```bash
crontab -e
# Add: 0 1 * * * /path/to/run-daily-report.sh
```

Runs daily at 8 AM Vietnam time (1 AM UTC).

### Monitor

```bash
# Test report
./run-daily-report.sh

# Check logs
tail -f daily-report.log
```

See [project-overview-pdr.md](./docs/project-overview-pdr.md) for detailed setup.

---

## 📋 Features

| Feature | Interactive | Automation |
|---------|-------------|-----------|
| **Query Jira** | ✅ Anytime | ✅ Daily |
| **Natural Language** | ✅ Yes | Settings-based |
| **Output Format** | Claude's choice | HTML/Telegram |
| **Notifications** | Console | Telegram |

---

## ⚙️ Requirements

- Claude Code CLI (installed & authenticated)
- Jira Server/Data Center v8.14.0+ (PAT support)
- Node.js 18+ (for automation only)
- curl, jq (system commands)

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| PAT invalid | Check token in `~/.claude/skills/jira-self-hosted/.env` |
| Jira not found | Verify JIRA_DOMAIN (no trailing slash) |
| Script timeout | Check network connectivity |
| Telegram error | Verify bot token and chat IDs in `.env` |

See [system-architecture.md](./docs/system-architecture.md) for detailed error handling.

---

## 📖 Customization

- **Defect Detection:** Edit `skills/jira-self-hosted/SKILL.md`
- **Report Format:** Edit `DAILY_PROMPT` in `daily-report.mjs`
- **Workflow Names:** Customize `JIRA_STATUSES` in `daily-report.mjs`

See [code-standards.md](./docs/code-standards.md) for conventions.

---

## 🐛 Defect Detection Logic

Auto-reports classify bugs based on changelog transitions:

| Pattern | Type | Description |
|---------|------|-------------|
| Testing → Resolved/In Progress/To Do | QC Reject | QC returns to work state |
| Testing → Reopened | Reopen | QC reopens issue |
| Resolved/Done → Reopened | Reopen | Bug reopened from done |
| In Progress → Resolved (Bug type) | Bug Fixed | Dev completed fix |

Customize in `daily-report.mjs` (DAILY_PROMPT) or `skills/jira-self-hosted/SKILL.md`.

---

## 📄 License

MIT
