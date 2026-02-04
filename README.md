# skill-jira-auto-report

🤖 Claude Code skill để tạo báo cáo Jira tự động và gửi qua Telegram.

**Chỉ hỗ trợ Jira Server/Data Center** (Self-Hosted) với PAT authentication.

---

> ⚠️ **LƯU Ý QUAN TRỌNG**
>
> Workflow và cấu hình trong repo này dựa trên mô hình hoạt động cụ thể của tác giả. **Bạn cần tự điều chỉnh lại** các thiết lập sau cho phù hợp với team của mình:
> - Danh sách projects (`JIRA_PROJECTS`)
> - Tên các trạng thái workflow (`JIRA_STATUSES`)
> - Danh sách users cần loại trừ (`EXCLUDED_USERS`)
> - Format báo cáo (`DAILY_PROMPT`)
>
> Xem phần **"Tùy chỉnh cấu hình"** để biết chi tiết.

---

## Phần 1: Sử dụng với Claude CLI (Interactive)

### Yêu cầu
- [Claude Code CLI](https://github.com/anthropics/claude-code) đã cài đặt và authenticate
- Jira Server/Data Center v8.14.0+ (hỗ trợ PAT)

### Cài đặt Skill

```bash
# Copy skill vào thư mục Claude
cp -r skills/jira-self-hosted ~/.claude/skills/

# Tạo file .env cho Jira
cat > ~/.claude/skills/jira-self-hosted/.env << EOF
JIRA_DOMAIN=https://your-jira-instance.com
JIRA_PAT=your_personal_access_token
EOF

# Test kết nối
~/.claude/skills/jira-self-hosted/scripts/jira-auth-test.sh
```

### Lấy Jira PAT

1. Đăng nhập Jira → Profile → Personal Access Tokens
2. Create token → Copy token
3. Thêm vào `.env`

### Cách Prompt

Trong Claude CLI, bạn có thể prompt:

```
Daily report Jira hôm qua.
Projects: PSV2, DIC, DEPOT

Dùng jira-self-hosted skill để:
1. Query issues updated hôm qua
2. Group theo status: Done, Resolved, Testing, In Progress
3. List theo người
```

Hoặc đơn giản:

```
/jira-self-hosted

Tổng hợp hoạt động team hôm qua cho projects PSV2, DIC
```

### Tham khảo

- `skills/jira-self-hosted/references/jql-guide.md` - Cú pháp JQL
- `skills/jira-self-hosted/references/api-reference.md` - API endpoints

---

## Phần 2: Chạy tự động với Cron

Chuyển đổi thành script chạy định kỳ, gửi report qua Telegram.

### Yêu cầu thêm
- Node.js 18+
- Telegram Bot
- Claude Code đã authenticate trên server

### Authentication

Script sử dụng authentication của Claude Code CLI. Nếu chạy tự động trên server:

```bash
# SSH vào server
ssh user@server

# Login Claude Code 1 lần
claude login

# Verify
claude --version
```

Sau khi login, Claude Code lưu credentials tại `~/.claude/` - cron job sẽ tự động sử dụng.

### Bước 1: Cấu hình Environment

```bash
cp .env.example .env
nano .env
```

```bash
# === TELEGRAM ===
TELEGRAM_BOT_TOKEN=123456:ABC...      # Token từ @BotFather
TELEGRAM_CHAT_ID=123456789            # Chat ID cho error notifications
TELEGRAM_GROUP_CHAT_ID=-100123456789  # Group ID cho daily report
TELEGRAM_GROUP_THREAD_ID=123          # Thread ID trong group (nếu có)

# === JIRA ===
JIRA_DOMAIN=https://your-jira.com
JIRA_PAT=your_personal_access_token
```

### Bước 2: Lấy Telegram IDs

**Bot Token:**
1. Chat với @BotFather → `/newbot` → copy token

**Chat ID (private):**
1. Chat với @userinfobot → Copy "Id"

**Group Chat ID:**
1. Thêm bot vào group
2. Gửi message trong group
3. Truy cập: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Tìm `"chat":{"id":-100...}`

**Thread ID (nếu dùng Topics):**
- Trong response `getUpdates`, tìm `"message_thread_id"`

### Bước 3: Cài đặt Skill

```bash
cp -r skills/jira-self-hosted ~/.claude/skills/
cp .env ~/.claude/skills/jira-self-hosted/.env
```

### Bước 4: Test

```bash
# Test Jira
~/.claude/skills/jira-self-hosted/scripts/jira-auth-test.sh

# Test report
./run-daily-report.sh
```

### Bước 5: Setup Cron

```bash
crontab -e
```

Thêm (8h sáng Vietnam = 1h UTC):

```cron
0 1 * * * /path/to/skill-jira-auto-report/run-daily-report.sh >> /path/to/daily-report.log 2>&1
```

### Cấu trúc

| File | Mô tả |
|------|-------|
| `run-daily-report.sh` | Load .env, retry 3x, gọi Node |
| `daily-report.mjs` | Spawn Claude CLI, gửi Telegram |

### Logic gửi Telegram

- ✅ Success → `TELEGRAM_GROUP_CHAT_ID` (thread nếu có)
- ❌ Error → `TELEGRAM_CHAT_ID` (private)

### Tùy chỉnh cấu hình

Mở `daily-report.mjs` và chỉnh phần **CẤU HÌNH** ở đầu file:

```javascript
// Danh sách project Jira cần theo dõi
const JIRA_PROJECTS = ["PSV2", "DIC", "DEPOT", "AVA"];

// Project chính để lấy danh sách team members
const MAIN_PROJECT = "PSV2";

// Danh sách user bỏ qua (không tính vào báo cáo)
const EXCLUDED_USERS = [
  "Jira Automation",
  "Unassigned",
  // Thêm tên user cần bỏ qua ở đây
];
```

| Biến | Mô tả |
|------|-------|
| `JIRA_PROJECTS` | Mảng các project key cần theo dõi |
| `MAIN_PROJECT` | Project dùng để query danh sách team members |
| `EXCLUDED_USERS` | Users không tính (bot, automation, manager...)|
| `JIRA_STATUSES` | Mapping tên status trong Jira của bạn |

### Workflow Statuses

```javascript
const JIRA_STATUSES = {
  done: "Done",           // Hoàn thành
  resolved: "Resolved",   // Dev xong, chờ QC
  testing: "Testing",     // QC đang test
  inProgress: "In Progress", // Đang làm
  toDo: "To Do",          // Chưa làm
};
```

**Workflow chuẩn:**
```
To Do → In Progress → Resolved → Testing → Done
```

⚠️ **Lưu ý:** Nếu Jira của bạn dùng tên status khác (ví dụ: "QA Testing" thay vì "Testing"), hãy chỉnh `JIRA_STATUSES` cho phù hợp.

### Cấu hình Workflow Logic (Bug/Reopen Detection)

Claude hiểu workflow thông qua **2 file**:

| File | Mục đích |
|------|----------|
| `skills/jira-self-hosted/SKILL.md` | Định nghĩa logic detect Bug, QC Reject, Reopen |
| `daily-report.mjs` → `DAILY_PROMPT` | Hướng dẫn cách format output |

**Để thay đổi cách detect Bug/Reopen:**

1. Mở `skills/jira-self-hosted/SKILL.md`
2. Tìm section `## Defect Detection Logic`
3. Chỉnh sửa định nghĩa theo workflow của bạn

Ví dụ thêm Reopen logic:
```markdown
### Reopen Definition
- Issue chuyển từ Done → bất kỳ status nào khác = Reopen
```

Claude sẽ đọc SKILL.md và áp dụng logic này khi generate report.

### Tùy chỉnh Prompt

Chỉnh `DAILY_PROMPT` trong `daily-report.mjs` nếu muốn thay đổi format báo cáo

---

## Troubleshooting

| Lỗi | Giải pháp |
|-----|-----------|
| PAT invalid | Kiểm tra token, JIRA_DOMAIN không trailing slash |
| API Error 500 | Anthropic server lỗi, script tự retry 3 lần |
| Không nhận Telegram | Bot đã add vào group? Thread ID đúng? |

---

## License

MIT

---

# English Version

🤖 Claude Code skill for automated Jira daily reports sent via Telegram.

**Only supports Jira Server/Data Center** (Self-Hosted) with PAT authentication.

---

> ⚠️ **IMPORTANT NOTE**
>
> The workflow and configuration in this repo are based on the author's specific setup. **You need to customize** the following settings to match your team's workflow:
> - Project list (`JIRA_PROJECTS`)
> - Workflow status names (`JIRA_STATUSES`)
> - Excluded users list (`EXCLUDED_USERS`)
> - Report format (`DAILY_PROMPT`)
>
> See **"Configuration"** section for details.

---

## Part 1: Using with Claude CLI (Interactive)

### Requirements
- [Claude Code CLI](https://github.com/anthropics/claude-code) installed and authenticated
- Jira Server/Data Center v8.14.0+ (PAT support)

### Install Skill

```bash
cp -r skills/jira-self-hosted ~/.claude/skills/

cat > ~/.claude/skills/jira-self-hosted/.env << EOF
JIRA_DOMAIN=https://your-jira-instance.com
JIRA_PAT=your_personal_access_token
EOF

~/.claude/skills/jira-self-hosted/scripts/jira-auth-test.sh
```

### Get Jira PAT

1. Login Jira → Profile → Personal Access Tokens
2. Create token → Copy token
3. Add to `.env`

### How to Prompt

```
Daily report for yesterday.
Projects: PSV2, DIC, DEPOT

Use jira-self-hosted skill to:
1. Query issues updated yesterday
2. Group by status: Done, Resolved, Testing, In Progress
3. List by person
```

---

## Part 2: Automated Cron Job

### Additional Requirements
- Node.js 18+
- Telegram Bot
- Claude Code authenticated on server

### Authentication

```bash
ssh user@server
claude login
claude --version
```

### Step 1: Configure Environment

```bash
cp .env.example .env
nano .env
```

```bash
# === TELEGRAM ===
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789            # For errors
TELEGRAM_GROUP_CHAT_ID=-100123456789  # For success
TELEGRAM_GROUP_THREAD_ID=123          # Thread ID (optional)

# === JIRA ===
JIRA_DOMAIN=https://your-jira.com
JIRA_PAT=your_personal_access_token
```

### Step 2: Get Telegram IDs

**Bot Token:** Chat @BotFather → `/newbot` → copy token

**Chat ID:** Chat @userinfobot → Copy "Id"

**Group Chat ID:**
1. Add bot to group
2. Send message in group
3. Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Find `"chat":{"id":-100...}`

### Step 3: Install Skill

```bash
cp -r skills/jira-self-hosted ~/.claude/skills/
cp .env ~/.claude/skills/jira-self-hosted/.env
```

### Step 4: Test

```bash
~/.claude/skills/jira-self-hosted/scripts/jira-auth-test.sh
./run-daily-report.sh
```

### Step 5: Setup Cron

```bash
crontab -e
```

Add (8am Vietnam = 1am UTC):

```cron
0 1 * * * /path/to/skill-jira-auto-report/run-daily-report.sh >> /path/to/daily-report.log 2>&1
```

### Configuration

Edit `daily-report.mjs`:

```javascript
const JIRA_PROJECTS = ["PSV2", "DIC", "DEPOT", "AVA"];
const MAIN_PROJECT = "PSV2";
const EXCLUDED_USERS = ["Jira Automation", "Unassigned"];
```

### Workflow Statuses

```javascript
const JIRA_STATUSES = {
  done: "Done",
  resolved: "Resolved",   // Dev done, waiting QC
  testing: "Testing",     // QC testing
  inProgress: "In Progress",
  toDo: "To Do",
};
```

**Standard workflow:**
```
To Do → In Progress → Resolved → Testing → Done
```

⚠️ If your Jira uses different status names, update `JIRA_STATUSES` accordingly.

### Workflow Logic Configuration (Bug/Reopen Detection)

Claude understands workflow through **2 files**:

| File | Purpose |
|------|---------|
| `skills/jira-self-hosted/SKILL.md` | Defines Bug, QC Reject, Reopen detection logic |
| `daily-report.mjs` → `DAILY_PROMPT` | Output format instructions |

**To change Bug/Reopen detection:**

1. Open `skills/jira-self-hosted/SKILL.md`
2. Find `## Defect Detection Logic` section
3. Modify definitions to match your workflow

Example - add Reopen logic:
```markdown
### Reopen Definition
- Issue moved from Done → any other status = Reopen
```

Claude reads SKILL.md and applies this logic when generating reports.

### Telegram Logic

- ✅ Success → `TELEGRAM_GROUP_CHAT_ID`
- ❌ Error → `TELEGRAM_CHAT_ID`

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| PAT invalid | Check token, JIRA_DOMAIN without trailing slash |
| API Error 500 | Anthropic server error, script retries 3 times |
| No Telegram message | Bot added to group? Thread ID correct? |
