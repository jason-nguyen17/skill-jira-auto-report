# skill-jira-auto-report

🤖 Claude Code skill để tạo báo cáo Jira tự động và gửi qua Telegram.

**Chỉ hỗ trợ Jira Server/Data Center** (Self-Hosted) với PAT authentication.

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
