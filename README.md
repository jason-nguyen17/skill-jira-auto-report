# jira-daily-digest

🤖 Jira daily report bot powered by Claude Code - auto-generates team activity digest and sends to Telegram.

## Features

- Query Jira Server/Data Center via REST API
- Generate daily team activity reports
- Track: Done, Resolved, Testing, In Progress
- Detect inactive team members
- Send reports to Telegram (group thread for success, private chat for errors)
- Retry logic (3 attempts with 60s delay)

## Architecture

```
┌─────────────────────────┬───────────────────────────────┐
│   daily-report.mjs      │   jira-self-hosted skill      │
│   (Runner/Sender)       │   (Data Provider)             │
├─────────────────────────┼───────────────────────────────┤
│ • Spawn Claude Code CLI │ • Query Jira REST API v2      │
│ • Define report prompt  │ • JQL search                  │
│ • Retry logic (3x)      │ • PAT authentication          │
│ • Send via Telegram API │ • Get team members/issues     │
└─────────────────────────┴───────────────────────────────┘
```

## Prerequisites

- Node.js 18+
- [Claude Code CLI](https://github.com/anthropics/claude-code) installed
- Jira Server/Data Center with PAT support (v8.14.0+)
- Telegram Bot

## Setup

1. Clone and configure:
```bash
cp .env.example .env
# Edit .env with your credentials
```

2. Install Claude Code skill:
```bash
cp -r skills/jira-self-hosted ~/.claude/skills/
```

3. Test connection:
```bash
./skills/jira-self-hosted/scripts/jira-auth-test.sh
```

4. Run manually:
```bash
./run-daily-report.sh
```

5. Setup cron (8am daily, UTC):
```bash
crontab -e
# Add: 0 1 * * * /path/to/jira-daily-digest/run-daily-report.sh >> /path/to/daily-report.log 2>&1
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Private chat for error notifications |
| `TELEGRAM_GROUP_CHAT_ID` | Group chat for success reports |
| `TELEGRAM_GROUP_THREAD_ID` | Thread ID in group |
| `JIRA_DOMAIN` | Jira instance URL |
| `JIRA_PAT` | Personal Access Token |

## Report Format

```
📊 BÁO CÁO JIRA - [date]

TỔNG QUAN
✅ Done: X | 📋 Resolved: X | 🧪 Testing: X | 🔄 In Progress: X

THEO NGƯỜI
👤 Name: ✅X 📋X 🧪X 🔄X

CHI TIẾT DONE/RESOLVED/TESTING/IN PROGRESS
• KEY: Description (Assignee)

🐛 BUG/REOPEN/REJECT
• Issues with defects

GHI CHÚ
• 😴 Inactive: Members with no activity
```

## License

MIT
