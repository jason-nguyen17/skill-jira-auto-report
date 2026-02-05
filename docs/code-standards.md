# Code Standards & Project Structure

**Project:** skill-jira-auto-report
**Version:** 1.0.0
**Last Updated:** 2026-02-05

## Overview

This document defines the coding conventions, project structure, and quality standards for skill-jira-auto-report. All contributors MUST follow these standards to maintain consistency and readability.

---

## File Organization

### Directory Structure Principles

```
skill-jira-auto-report/
├── docs/                          # Project documentation
│   ├── project-overview-pdr.md    # Requirements & roadmap
│   ├── system-architecture.md     # Architecture & design
│   ├── code-standards.md          # THIS FILE
│   ├── codebase-summary.md        # Code inventory
│   ├── development-roadmap.md     # Phases & timeline
│   └── project-changelog.md       # History & changes
│
├── skills/jira-self-hosted/       # Claude Code skill
│   ├── SKILL.md                   # Skill definition & interface
│   ├── scripts/                   # Bash helper scripts
│   │   ├── jira-auth-test.sh     # Test PAT (34 LOC max)
│   │   ├── jira-search.sh        # Query issues (100 LOC max)
│   │   └── jira-issue-get.sh     # Get issue details (100 LOC max)
│   │
│   └── references/                # Documentation for Claude
│       ├── api-reference.md       # REST API endpoints
│       ├── authentication.md      # PAT setup & troubleshooting
│       ├── jql-guide.md           # JQL syntax & examples
│       └── best-practices.md      # Security & performance tips
│
├── daily-report.mjs               # Main cron script (250 LOC max)
├── run-daily-report.sh            # Shell wrapper (50 LOC max)
├── install-skill.sh               # Installer (100 LOC max)
├── env.claude                     # JIRA env template
├── .env.example                   # Telegram env template
├── .gitignore                     # Git exclusions
└── README.md                      # User-facing documentation
```

### File Naming Conventions

| File Type | Convention | Example | Rationale |
|-----------|-----------|---------|-----------|
| Bash scripts | kebab-case | `jira-auth-test.sh` | POSIX compatibility, readability |
| Node.js | kebab-case or .mjs | `daily-report.mjs` | ES modules, clarity |
| Markdown docs | kebab-case | `system-architecture.md` | Searchable, consistent |
| Config | UPPERCASE or .env | `.env.example`, `env.claude` | Convention |

**Rules:**
- Use descriptive names (not `script.sh`, use `jira-auth-test.sh`)
- Keep names under 50 characters
- Use hyphens, not underscores (except in special cases)
- File purpose should be obvious from name

---

## Bash Script Standards

### File Size Limit
- **Maximum:** 100 lines per script (excluding comments and blank lines)
- **Rationale:** Easier testing, debugging, maintenance
- **Exception:** Complex scripts may extend to 150 LOC with approval

### Template Structure

```bash
#!/bin/bash
# Script: jira-search.sh
# Purpose: Execute JQL queries against Jira
# Usage: ./jira-search.sh "project = PROJ AND status = Open"
# Returns: JSON array of issues or error

# ============================================================
# CONFIGURATION
# ============================================================

# Strict mode
set -euo pipefail

# Load environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/../.env" ]]; then
  source "$SCRIPT_DIR/../.env"
fi

# Validate required variables
if [[ -z "${JIRA_DOMAIN:-}" ]] || [[ -z "${JIRA_PAT:-}" ]]; then
  echo "ERROR: JIRA_DOMAIN and JIRA_PAT not set" >&2
  exit 1
fi

# ============================================================
# FUNCTION: query_jira
# ============================================================

query_jira() {
  local jql="$1"

  curl -s -X POST \
    -H "Authorization: Bearer ${JIRA_PAT}" \
    -H "Content-Type: application/json" \
    -d "{\"jql\": \"${jql}\", \"maxResults\": 100}" \
    "${JIRA_DOMAIN}/rest/api/2/search"
}

# ============================================================
# MAIN
# ============================================================

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <JQL_QUERY>" >&2
  exit 1
fi

JQL="$1"
RESULT=$(query_jira "$JQL")

# Check for API errors
if echo "$RESULT" | jq -e '.errorMessages' >/dev/null 2>&1; then
  echo "ERROR: $(echo "$RESULT" | jq -r '.errorMessages[0]')" >&2
  exit 1
fi

# Return JSON
echo "$RESULT" | jq '.issues'
```

### Bash Best Practices

**1. Error Handling**
```bash
set -euo pipefail          # Exit on error, unset vars, pipe fail
trap 'echo "Error on line $LINENO" >&2' ERR

# Or explicit error checking
if ! result=$(some_command); then
  echo "ERROR: Command failed: $result" >&2
  exit 1
fi
```

**2. Variable Usage**
```bash
# Use double quotes for variable expansion
echo "Domain: ${JIRA_DOMAIN}"

# Check if set
if [[ -z "${VAR:-}" ]]; then
  echo "VAR is not set" >&2
  exit 1
fi

# Provide default
TIMEOUT="${TIMEOUT:-30}"
```

**3. JSON Processing**
```bash
# Use jq for parsing (avoid grep/sed)
echo "$response" | jq '.issues[] | {key: .key, summary: .summary}'

# Check if field exists
if jq -e '.errorMessages' "$response" >/dev/null 2>&1; then
  echo "API returned error"
fi
```

**4. Logging & Messages**
```bash
# Errors to stderr
echo "ERROR: Something went wrong" >&2

# Normal output to stdout
echo "SUCCESS: Operation completed"

# Debug (if DEBUG=1)
[[ "${DEBUG:-0}" = "1" ]] && echo "DEBUG: Variable value=$var" >&2
```

**5. Function Style**
```bash
# Use function keyword
function validate_token() {
  local token="$1"
  [[ -n "$token" ]] && return 0 || return 1
}

# Call with explicit arguments
if validate_token "$JIRA_PAT"; then
  echo "Token OK"
fi
```

### Testing Bash Scripts

```bash
# Test with sample input
./jira-auth-test.sh

# Check exit code
echo $?

# Debug mode
DEBUG=1 ./jira-search.sh "project = PROJ"

# Lint with shellcheck
shellcheck jira-search.sh
```

---

## Node.js Standards

### File Size Limit
- **Maximum:** 250 lines per file
- **Rationale:** Cognitive load, testability
- **Exception:** daily-report.mjs allowed 250 LOC (main script)

### Template Structure (ES Modules)

```javascript
#!/usr/bin/env node
/**
 * daily-report.mjs
 * Purpose: Generate daily Jira report and send via Telegram
 * Usage: node daily-report.mjs
 * Returns: Exit code 0 (success) or 1 (error)
 */

import { spawn } from 'child_process';

// ============================================================
// CONFIGURATION
// ============================================================

// Team projects to track
const JIRA_PROJECTS = ['PSV2', 'DIC'];

// Team member source
const MAIN_PROJECT = 'PSV2';

// Skip users
const EXCLUDED_USERS = ['Jira Automation', 'Unassigned'];

// Workflow status names (customize for your Jira)
const JIRA_STATUSES = {
  done: 'Done',
  resolved: 'Resolved',
  testing: 'Testing',
  inProgress: 'In Progress',
  toDo: 'To Do',
};

// ============================================================
// CONSTANTS
// ============================================================

const TIMEOUT_MINUTES = 5;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

// ============================================================
// FUNCTIONS
// ============================================================

/**
 * Run Claude CLI with given prompt
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} - Claude's response
 */
async function runClaudeCode(prompt) {
  return new Promise((resolve, reject) => {
    const process = spawn('claude', ['-p'], {
      dangerously_skip_permissions: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Claude exited with code ${code}: ${errorOutput}`));
      }
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to spawn Claude: ${err.message}`));
    });

    // Write prompt and close stdin
    process.stdin.write(prompt);
    process.stdin.end();

    // Timeout protection
    setTimeout(() => {
      process.kill();
      reject(new Error(`Claude execution timeout after ${TIMEOUT_MINUTES} minutes`));
    }, TIMEOUT_MS);
  });
}

/**
 * Send message via Telegram Bot API
 * @param {string} chatId - Telegram chat ID
 * @param {string} text - Message text
 * @returns {Promise<void>}
 */
async function sendTelegramMessage(chatId, text) {
  // Implementation...
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    // Step 1: Build prompt
    const prompt = buildDailyPrompt();

    // Step 2: Run Claude
    const report = await runClaudeCode(prompt);

    // Step 3: Send Telegram
    await sendTelegramMessage(
      process.env.TELEGRAM_GROUP_CHAT_ID,
      report
    );

    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

main();
```

### Node.js Best Practices

**1. Error Handling**
```javascript
// Use try-catch for async
try {
  const response = await fetch(url);
  const data = await response.json();
} catch (error) {
  console.error('Request failed:', error.message);
  process.exit(1);
}

// Promise rejection handling
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
```

**2. Configuration**
```javascript
// Constants at top
const TIMEOUT_MS = 5 * 60 * 1000;

// Environment variables with defaults
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Validate required vars
if (!TELEGRAM_TOKEN) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN not set');
  process.exit(1);
}
```

**3. Logging**
```javascript
// Error to stderr with context
console.error('ERROR: Failed to query Jira:', error.message);

// Info to stdout
console.log('SUCCESS: Report sent');

// Debug (check environment)
if (process.env.DEBUG) {
  console.error('DEBUG: Request body:', body);
}
```

**4. Async/Await Pattern**
```javascript
// Named functions for clarity
async function runClaudeCode(prompt) {
  // Explicit return or throw
  if (!prompt) throw new Error('Prompt required');

  return new Promise((resolve, reject) => {
    // Setup
    const timer = setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS);

    // Cleanup
    process.on('close', () => clearTimeout(timer));
  });
}

// Await at call site
const result = await runClaudeCode(prompt);
```

**5. String Formatting**
```javascript
// Use template literals (not string concatenation)
const url = `${JIRA_DOMAIN}/rest/api/2/search`;

// For SQL/API, use JSON objects (not string building)
const body = {
  jql: jqlQuery,
  maxResults: 100,
  fields: ['key', 'summary', 'status'],
};

// Telegram HTML formatting (no markdown)
const message = `<b>Report</b>\n✅ Done: ${count}`;
```

### Testing Node.js Scripts

```bash
# Run with debug
DEBUG=1 node daily-report.mjs

# Check for syntax errors
node --check daily-report.mjs

# Lint with ESLint
npx eslint daily-report.mjs

# Test in isolation
node -e "
  import('./daily-report.mjs').then(() => {
    console.log('Syntax OK');
  });
"
```

---

## Markdown Documentation Standards

### File Size Limit
- **Maximum:** 800 lines per file
- **Strategy:** Split large docs into topic directories with index.md

### Structure Template

```markdown
# Document Title

**Project:** skill-jira-auto-report
**Version:** 1.0.0
**Last Updated:** 2026-02-05
**Status:** Complete/In Progress/Draft

## Overview
2-3 sentence purpose and scope.

## Table of Contents (if >100 lines)
- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1
Clear, actionable content.

### Subsection 1a
Use ### for subsections.

### Subsection 1b
Keep hierarchy consistent.

## Section 2
---

## Related Documents
- [Other Doc](./other.md) - Brief description
```

### Markdown Best Practices

**1. Clarity First**
```markdown
# ❌ BAD - Vague title
## Some Implementation Details

# ✅ GOOD - Descriptive title
## REST API v2 Endpoints

# ❌ BAD - Long paragraph
The system integrates with Jira using REST API v2...

# ✅ GOOD - Broken into sections with examples
### Authentication
Use Bearer token: `Authorization: Bearer {PAT}`

### Example
\`\`\`bash
curl -H "Authorization: Bearer token123" ...
\`\`\`
```

**2. Code Blocks**
```markdown
# Bash with syntax highlighting
\`\`\`bash
curl -s -H "Authorization: Bearer $PAT" $URL
\`\`\`

# JSON example
\`\`\`json
{
  "jql": "project = PROJ",
  "maxResults": 50
}
\`\`\`

# No language (for plaintext)
\`\`\`
Example output or config
\`\`\`
```

**3. Tables for Comparisons**
```markdown
| Item | Value | Status |
|------|-------|--------|
| Feature A | Implemented | ✅ |
| Feature B | Planned | ⏳ |

# Better than listing in paragraphs
```

**4. Lists & Checklists**
```markdown
# Use bullets for unordered
- Item 1
- Item 2
  - Nested item

# Use numbers for ordered steps
1. First step
2. Second step
3. Third step

# Use checkboxes for tracking
- [x] Completed task
- [ ] Pending task
```

**5. Cross-References**
```markdown
# Internal links (relative paths)
See [System Architecture](./system-architecture.md) for details.

# Link to sections
Refer to [Configuration](#configuration) above.

# Link to code
Check [daily-report.mjs](../daily-report.mjs) for implementation.
```

### Documentation Review Checklist

- [ ] Spelling and grammar checked
- [ ] Code examples tested and functional
- [ ] Links are relative and working
- [ ] No sensitive info (PAT, tokens, API keys)
- [ ] Consistent terminology (use glossary)
- [ ] File under 800 lines (or split into topic/)
- [ ] Related documents linked
- [ ] Last updated date current

---

## Comments & Naming

### Variable Naming

```bash
# Bash: lowercase with underscores
jira_domain="https://jira.example.com"
auth_token="abc123..."

# For constants: UPPERCASE
JIRA_PROJECTS=("PSV2" "DIC")
MAX_RESULTS=100
```

```javascript
// JavaScript: camelCase for variables
const jiraDomain = 'https://jira.example.com';
let authToken = 'abc123...';

// Constants: UPPERCASE_WITH_UNDERSCORES
const JIRA_PROJECTS = ['PSV2', 'DIC'];
const MAX_RESULTS = 100;

// Classes/constructors: PascalCase
class JiraClient {
  constructor(domain, token) { }
}
```

### Function Naming

```bash
# Bash: descriptive, lowercase with hyphens
function validate-jira-token() { }
function parse-jira-response() { }
```

```javascript
// JavaScript: verb + noun, camelCase
function validateJiraToken() { }
function parseJiraResponse() { }
async function fetchJiraIssues() { }
```

### Comments

**Good Comments:**
```bash
# Check if token is valid by querying /myself endpoint
if validate_jira_token "$JIRA_PAT"; then
  echo "Token OK"
fi
```

```javascript
// Convert timestamp to human-readable date for report
const reportDate = new Date(yesterday).toLocaleDateString('vi-VN');
```

**Bad Comments:**
```bash
# Check token
validate_jira_token
```

```javascript
// Set variable
let x = 5;
```

---

## Security Standards

### Secrets Management

**Rules:**
1. **Never commit secrets** to git (.env excluded via .gitignore)
2. **Store in .env files** (development and production)
3. **Load at runtime** (never hardcode)
4. **Don't log values** (log keys, not values)
5. **Use environment variables** for CI/CD

```bash
# ✅ GOOD
export JIRA_PAT="$TOKEN"  # From .env
curl -H "Authorization: Bearer ${JIRA_PAT}" ...

# ❌ BAD
curl -H "Authorization: Bearer abc123def456..." ...  # Hardcoded
echo "Token: $JIRA_PAT"  # Logged (if enabled)
```

### API Key Handling

```javascript
// ✅ Load from environment
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ✅ Validate early
if (!TELEGRAM_TOKEN) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN not set');
  process.exit(1);
}

// ✅ Use in requests (won't appear in logs)
const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

// ❌ DON'T log the token
console.log('Token:', TELEGRAM_TOKEN);  // NEVER

// ❌ DON'T include in error messages
fetch(url).catch(err => {
  console.error('Request failed:', url);  // If url contains token, DON'T log it
});
```

---

## Testing Standards

### Unit Test Approach

For bash scripts:
```bash
# Test in isolation with sample data
echo '{"jql": "project = TEST"}' | ./jira-search.sh

# Check exit code
[[ $? -eq 0 ]] && echo "PASS" || echo "FAIL"
```

For Node.js:
```bash
# Test module imports
node --check daily-report.mjs

# Test function execution
node -e "import('./utils.mjs').then(m => m.testFunc())"
```

### Manual Testing Checklist

- [ ] Scripts run without syntax errors
- [ ] Error cases handled gracefully
- [ ] Environment variables load correctly
- [ ] API responses parse without errors
- [ ] Telegram messages send successfully
- [ ] Cron jobs execute and log properly

---

## Performance Standards

### Response Time Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| PAT validation | < 500ms | jira-auth-test.sh execution |
| JQL search (50 issues) | < 1s | curl + jq processing |
| Daily report generation | < 5 min | total timeout |
| Telegram send | < 200ms | API latency |

### Optimization Guidelines

1. **Limit API queries** - Use field selection, pagination
2. **Cache strategically** - Don't cache dynamic data (daily reports)
3. **Batch requests** - Query multiple projects in one JQL
4. **Monitor logs** - Track execution times, identify bottlenecks

---

## Version Control Standards

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build, dependencies

**Examples:**
```
feat(skill): add JQL field selection for better performance

This allows Claude to request only needed fields from API,
reducing payload and improving response time.

Fixes #42
```

```
fix(scripts): handle Jira API 401 errors gracefully

Check for Authorization header and PAT validity before
making requests.
```

### .gitignore Rules

```
# Never commit
.env
.env.dev
*.log
node_modules/
.vscode/personal-settings.json

# Exclude IDE
.idea/
*.swp
*.swo

# Allow templates
!.env.example
!env.claude
```

---

## Dependency Management

### Allowed Dependencies

**External:**
- Node.js built-ins only (no npm packages)
- System commands: `curl`, `jq`, `node`, `bash`
- Claude Code CLI

**Rationale:**
- Minimal attack surface
- Easy deployment (no npm install)
- Portable across systems

### Adding New Dependencies

Before adding external packages:

1. **Check if built-in available** - Use `child_process` instead of spawning
2. **Consider complexity** - Is it worth the dependency?
3. **Review security** - Is package maintained and audited?
4. **Document reason** - Update this section with justification

---

## Quality Checklist

Before committing code:

- [ ] Syntax check passes (shellcheck for bash, node --check for JS)
- [ ] File size under limit (bash 100, node 250, docs 800)
- [ ] Variables properly named (camelCase/UPPER_CASE/kebab-case)
- [ ] Error handling present (try-catch, set -e)
- [ ] Comments explain non-obvious logic
- [ ] Secrets not hardcoded (use .env)
- [ ] No console.log debugging statements left
- [ ] Related docs updated
- [ ] Links and references work

---

## Related Documents

- **Project Overview & PDR:** [./project-overview-pdr.md](./project-overview-pdr.md)
- **System Architecture:** [./system-architecture.md](./system-architecture.md)
- **Codebase Summary:** [./codebase-summary.md](./codebase-summary.md)
- **Development Roadmap:** [./development-roadmap.md](./development-roadmap.md)
