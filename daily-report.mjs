#!/usr/bin/env node

import { spawn } from "child_process";

// ============================================================
// CẤU HÌNH - CHỈNH SỬA THEO TEAM CỦA BẠN
// ============================================================

// Danh sách project Jira cần theo dõi
const JIRA_PROJECTS = ["PSV2", "DIC", "DEPOT", "AVA"];

// Project chính để lấy danh sách team members
const MAIN_PROJECT = "PSV2";

// Danh sách user bỏ qua (không tính vào báo cáo)
const EXCLUDED_USERS = [
  "Jira Automation",
  "Unassigned",
  "Nguyễn Minh Thuận",
  "Phan Huỳnh Toàn Đức",
  "Jason"
  // Thêm tên user cần bỏ qua ở đây
];

// Workflow statuses trong Jira của bạn
// Chỉnh sửa nếu Jira của bạn dùng tên khác
const JIRA_STATUSES = {
  done: "Done",           // Hoàn thành
  resolved: "Resolved",   // Dev xong, chờ QC
  testing: "Testing",     // QC đang test
  inProgress: "In Progress", // Đang làm
  toDo: "To Do",          // Chưa làm
};

// ============================================================
// TELEGRAM CONFIG (từ .env)
// ============================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // For errors
const TELEGRAM_GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID; // For success
const TELEGRAM_GROUP_THREAD_ID = process.env.TELEGRAM_GROUP_THREAD_ID; // Thread in group

// ============================================================
// PROMPT TEMPLATE
// ============================================================
const projectList = JIRA_PROJECTS.join(", ");
const excludeList = EXCLUDED_USERS.map(u => `"${u}"`).join(", ");

const DAILY_PROMPT = `[CRITICAL INSTRUCTION] Your ENTIRE response must start with "📊" - NO other text before it. Do NOT write any thinking, explanation, or narration like "Tôi đã có dữ liệu", "Bây giờ tôi sẽ", etc. ONLY output the report.

Daily report Jira hôm nay.

PROJECTS: ${projectList}

BƯỚC 1 - LẤY TEAM MEMBERS:
Dùng jira-self-hosted skill để query API lấy danh sách team members:
GET /rest/api/2/user/assignable/search?project=${MAIN_PROJECT}&maxResults=100
Exclude: ${excludeList}

BƯỚC 2 - LẤY ISSUES HÔM QUA VỚI CHANGELOG:
Query JQL với expand=changelog:
./jira-search.sh "project IN (${projectList}) AND updated >= startOfDay(-1) AND updated < startOfDay()" -e changelog

Hoặc API call:
POST /rest/api/2/search
{
  "jql": "project IN (${projectList}) AND updated >= startOfDay(-1) AND updated < startOfDay()",
  "fields": ["key", "summary", "status", "assignee", "issuetype"],
  "expand": ["changelog"]
}

BƯỚC 2.5 - PHÂN TÍCH BUGS TỪ CHANGELOG:
Từ changelog của mỗi issue, lọc các thay đổi status trong ngày hôm qua:
1. Lọc items có field === "status"
2. Lọc items có created trong ngày hôm qua

PHÂN LOẠI BUGS:
| Pattern | Loại | Giải thích |
|---------|------|------------|
| Testing → Resolved/In Progress/To Do | QC Reject | QC phát hiện bug, trả về work state (KHÔNG phải Reopened) |
| Testing → Reopened | Reopen | QC phát hiện bug, mở lại issue |
| Resolved/Done → Reopened/In Progress/To Do | Reopen | Bug được mở lại từ trạng thái hoàn thành |
| In Progress → Resolved (issue type = Bug) | Bug Fixed | Dev fix xong bug |

ĐẾM:
- bugs_found = số QC Reject + số Reopen trong ngày
- bugs_fixed = số Bug type chuyển sang Resolved/Done trong ngày

BƯỚC 3 - XÁC ĐỊNH NGƯỜI KHÔNG HOẠT ĐỘNG:
So sánh team members với assignees có task hôm qua → list người không có task nào

BẮT BUỘC:
1. Output BẮT ĐẦU NGAY bằng 📊 - TUYỆT ĐỐI KHÔNG có text nào trước đó
2. KHÔNG viết câu mở đầu như: "Tôi đã có dữ liệu", "Bây giờ tôi sẽ", "Dựa trên", "Tổng hợp", "phân tích và tạo báo cáo", hay bất kỳ giải thích/narration nào
3. KHÔNG dùng markdown ** hoặc __ - CHỈ dùng HTML <b></b>
4. KHÔNG dùng table markdown | hoặc ---
5. CHỈ output báo cáo theo FORMAT bên dưới, KHÔNG có bất kỳ text nào khác

FORMAT (copy chính xác cấu trúc này):

📊 <b>BÁO CÁO JIRA - [ngày hôm qua]</b>

<b>TỔNG QUAN</b>
✅ Done: X | 📋 Resolved: X | 🧪 Testing: X | 🔄 In Progress: X

<b>🐛 BUG SUMMARY</b>
• Phát hiện: X (QC reject: Y, Reopen: Z)
• Đã fix: X
• Chi tiết:
  - KEY: QC Reject (Author, HH:mm)
  - KEY: Reopen (Author, HH:mm)
  - KEY: Bug Fixed (Author, HH:mm)
(hoặc "Không có bugs trong ngày" nếu không có)

<b>THEO NGƯỜI</b>
👤 Tên: ✅X 📋X 🧪X 🔄X

<b>CHI TIẾT DONE</b>
• KEY: Mô tả (Assignee)

<b>CHI TIẾT RESOLVED</b> (Dev xong, chờ QC)
• KEY: Mô tả (Assignee)

<b>CHI TIẾT TESTING</b>
• KEY: Mô tả (Assignee)

<b>CHI TIẾT IN PROGRESS</b>
• KEY: Mô tả (Assignee)

<b>GHI CHÚ</b>
• 😴 Không hoạt động: Tên1, Tên2 (từ BƯỚC 3 - những người trong team nhưng không có task hôm nay)
• Ghi chú khác nếu có

LƯU Ý: Nếu changelog trống hoặc không có, bỏ qua section BUG SUMMARY.`;

function runClaudeCode(prompt) {
  return new Promise((resolve, reject) => {
    console.log("📝 Prompt:", prompt.slice(0, 50) + "...");

    // Chạy claude CLI với flag --print (chỉ output, không interactive)
    const claude = spawn(
      "claude",
      ["-p", prompt, "--output-format", "text", "--dangerously-skip-permissions"],
      {
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"], // Ignore stdin to force non-interactive
      }
    );

    console.log("🚀 Claude process started, PID:", claude.pid);

    // Timeout 5 phút
    const timeout = setTimeout(() => {
      console.log("⏰ Timeout! Killing process...");
      claude.kill();
      reject(new Error("Claude timed out after 5 minutes"));
    }, 5 * 60 * 1000);

    let output = "";
    let error = "";

    claude.stdout.on("data", (data) => {
      const chunk = data.toString();
      process.stdout.write(chunk); // Stream output realtime
      output += chunk;
    });

    claude.stderr.on("data", (data) => {
      const chunk = data.toString();
      process.stderr.write(chunk); // Stream errors realtime
      error += chunk;
    });

    claude.on("close", (code) => {
      clearTimeout(timeout);
      console.log("🏁 Claude exited with code:", code);
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Claude exited with code ${code}: ${error}`));
      }
    });

    claude.on("error", (err) => {
      clearTimeout(timeout);
      console.error("💥 Spawn error:", err.message);
      reject(err);
    });
  });
}

async function sendTelegramMessage(text, chatId, threadId = null) {
  // Telegram có limit 4096 chars, cần split nếu dài
  const chunks = splitMessage(text, 4000);

  for (const chunk of chunks) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: chunk,
      parse_mode: "HTML",
    };
    if (threadId) {
      body.message_thread_id = parseInt(threadId);
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

function splitMessage(text, maxLength) {
  // Nếu text ngắn, trả về nguyên
  if (text.length <= maxLength) {
    return [text];
  }

  // Split theo dòng để không cắt giữa chừng
  const lines = text.split("\n");
  const chunks = [];
  let current = "";

  for (const line of lines) {
    if ((current + "\n" + line).length > maxLength) {
      if (current) chunks.push(current.trim());
      current = line;
    } else {
      current = current ? current + "\n" + line : line;
    }
  }
  if (current) chunks.push(current.trim());

  return chunks;
}

async function main() {
  try {
    console.log("🤖 Running Claude Code with skills...");
    const response = await runClaudeCode(DAILY_PROMPT);

    // Success → send to group thread
    console.log("📤 Sending to Telegram Group...");
    await sendTelegramMessage(response, TELEGRAM_GROUP_CHAT_ID, TELEGRAM_GROUP_THREAD_ID);

    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    // Error → send to private chat
    await sendTelegramMessage(`❌ <b>Daily Report Failed</b>\n\nError: ${error.message}`, TELEGRAM_CHAT_ID);
    process.exit(1);
  }
}

main();