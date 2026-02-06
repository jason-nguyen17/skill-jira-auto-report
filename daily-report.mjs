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

const DAILY_PROMPT = `Tạo báo cáo Jira hàng ngày. LUÔN dùng tiếng Việt. Output CHỈ là báo cáo theo FORMAT bên dưới.

PROJECTS: ${projectList}

BƯỚC 1 - LẤY ISSUES HÔM QUA VỚI CHANGELOG:
Dùng jira-self-hosted skill:
./jira-search.sh "project IN (${projectList}) AND updated >= startOfDay(-1) AND updated < startOfDay()" -e changelog

BƯỚC 2 - PHÂN LOẠI ISSUES:
Từ kết quả JQL, chia thành 2 nhóm:

NHÓM A - ISSUES CÓ STATUS TRANSITION HÔM QUA:
Duyệt changelog.histories, lọc entries có created trong ngày hôm qua VÀ items chứa field === "status".
CHỈ những issue có ÍT NHẤT 1 status transition hôm qua mới được tính vào báo cáo status.
Issue chỉ có thay đổi khác (comment, link, description...) mà KHÔNG có status transition → KHÔNG đưa vào.

NHÓM B - TẤT CẢ ISSUES UPDATED HÔM QUA:
Toàn bộ kết quả JQL → dùng để xác định người hoạt động.

BƯỚC 3 - PHÂN TÍCH BUGS TỪ CHANGELOG (NHÓM A):
Lọc status transitions trong ngày hôm qua:
- QC Reject: Testing → Resolved/In Progress/To Do
- Reopen: Testing → Reopened HOẶC Resolved/Done → Reopened/In Progress/To Do
- Bug Fixed: In Progress → Resolved (issue type = Bug)
- bugs_found = QC Reject + Reopen
- bugs_fixed = Bug type chuyển sang Resolved/Done

BƯỚC 4 - LẤY TEAM MEMBERS:
GET /rest/api/2/user/assignable/search?project=${MAIN_PROJECT}&maxResults=100
Exclude: ${excludeList}
So sánh với assignees NHÓM B → xác định người không hoạt động.

QUY TẮC OUTPUT:
1. Output BẮT ĐẦU NGAY bằng 📊 - TUYỆT ĐỐI KHÔNG có text nào trước đó
2. KHÔNG viết phân tích, giải thích, narration, thinking. VD: "Tôi đã có dữ liệu", "Phân tích:", "Let me analyze" → CẤM
3. KHÔNG dùng markdown (**, __, \`\`\`, |, ---). CHỈ dùng HTML <b></b>
4. KHÔNG thêm section nào ngoài FORMAT. LUÔN giữ tất cả sections kể cả khi = 0
5. Nếu không có bugs → hiển thị "• Không có bugs trong ngày"

FORMAT:

📊 <b>BÁO CÁO JIRA - [ngày hôm qua DD/MM/YYYY] ([thứ trong tuần])</b>

<b>📋 STATUS HIỆN TẠI</b> (NHÓM A - status cuối cùng sau transition cuối hôm qua)
✅ Done: X | 📋 Resolved: X | 🧪 Testing: X | 🔄 In Progress: X

<b>📈 TRANSITIONS TRONG NGÀY</b> (đếm mỗi lần chuyển status, 1 issue có thể đếm nhiều lần)
→ Done: X | → Resolved: X | → Testing: X | → In Progress: X | → Reopened: X

<b>👥 THÀNH VIÊN</b>
• Hoạt động: Tên1 (✅X 📋X 🧪X 🔄X), Tên2 (✅X 📋X 🧪X 🔄X)
• 😴 Không hoạt động: Tên3, Tên4
(Hoạt động = có issue updated hôm qua trong NHÓM B. Số liệu status = tính theo NHÓM A, status cuối cùng. LUÔN hiển thị đủ 4 cột kể cả = 0)

<b>🐛 BUG SUMMARY</b>
• Phát hiện: X (QC reject: Y, Reopen: Z)
• Đã fix: X
• Chi tiết:
  - KEY: Loại (Author, HH:mm) — fromStatus → toStatus
(hoặc "• Không có bugs trong ngày")

<b>✅ CHI TIẾT DONE</b>
• KEY: Mô tả (Assignee)
(hoặc "• Không có")

<b>📋 CHI TIẾT RESOLVED</b>
• KEY: Mô tả (Assignee)
(hoặc "• Không có")

<b>🧪 CHI TIẾT TESTING</b>
• KEY: Mô tả (Assignee)
(hoặc "• Không có")

<b>🔄 CHI TIẾT IN PROGRESS</b>
• KEY: Mô tả (Assignee)
(hoặc "• Không có")`;

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

// Strip text trước 📊 (Claude có thể output analysis/thinking trước báo cáo)
// Chuyển markdown bold sang HTML bold (safety net cho Telegram parse_mode=HTML)
function sanitizeForTelegram(text) {
  const reportStart = text.indexOf("📊");
  if (reportStart > 0) text = text.substring(reportStart);
  return text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
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
    const rawResponse = await runClaudeCode(DAILY_PROMPT);
    const response = sanitizeForTelegram(rawResponse);

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