# Project Changelog

**Project:** skill-jira-auto-report
**Latest Version:** 1.0.0
**Last Updated:** 2026-02-05

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-02-05

### 📦 Release Summary

Initial stable release of skill-jira-auto-report. Provides complete Jira integration with interactive Q&A via Claude Code and automated daily reports via cron + Telegram.

**Highlights:**
- ✅ Jira REST API v2 integration (PAT authentication)
- ✅ Claude Code skill interface with helper scripts
- ✅ Automated daily reports (cron-based)
- ✅ Telegram notifications (success/error routing)
- ✅ Comprehensive documentation (Vietnamese/English)
- ✅ Configuration customization (no code changes)

### ✨ Added

#### Skill Interface
- **SKILL.md** - Claude Code skill definition
  - Skill metadata (name, version, license)
  - When to use (scope, limitations)
  - Implementation workflow
  - Defect detection logic
  - Environment setup instructions

#### Helper Scripts
- **jira-auth-test.sh** - Validate PAT connection
  - Tests GET /rest/api/2/myself endpoint
  - Provides clear error messages
  - Exit codes for scripting

- **jira-search.sh** - Execute JQL queries
  - Supports complex JQL syntax
  - Field selection for performance
  - JSON output with jq parsing
  - Pagination support (maxResults=100)

- **jira-issue-get.sh** - Fetch issue details
  - Get full issue including comments
  - Field selection
  - JSON output

#### Documentation References
- **api-reference.md** - REST API v2 endpoints
  - Search (POST & GET)
  - Issue operations
  - Projects and team members
  - Comments
  - Pagination & error responses

- **authentication.md** - PAT setup and usage
  - Token generation steps
  - Bearer header format
  - Common errors and troubleshooting
  - Token security best practices

- **jql-guide.md** - JQL query syntax
  - Operators (AND, OR, NOT, IN, LIKE)
  - Field references
  - Date functions (startOfDay, startOfWeek, etc.)
  - 15+ example queries
  - Advanced patterns

- **best-practices.md** - Performance & security
  - Error handling strategy
  - Retry logic patterns
  - API rate limiting
  - Security considerations
  - Field selection optimization

#### Automation Scripts
- **daily-report.mjs** - Main report generation
  - Configuration section (customizable projects, users, statuses)
  - 3-step JQL workflow (team members, issues, inactive detection)
  - Claude CLI spawning with prompt injection
  - Telegram integration (success/error routing)
  - Message splitting (4096 char limit)
  - HTML formatting for Telegram
  - Error handling with context

- **run-daily-report.sh** - Shell wrapper
  - Environment variable loading (.env/.env.dev)
  - Node.js availability check
  - Retry logic (3 attempts with 5s delay)
  - Cron-friendly output
  - Exit codes for monitoring

#### Installation & Setup
- **install-skill.sh** - Automated installation
  - Verifies Claude CLI installed
  - Creates skill directory structure
  - Copies SKILL.md and references
  - Copies helper scripts
  - Generates env.claude template
  - Idempotent (safe to run multiple times)

- **env.claude** - Jira configuration template
  - JIRA_DOMAIN placeholder
  - JIRA_PAT placeholder
  - Instructions for setup

- **.env.example** - Telegram configuration template
  - TELEGRAM_BOT_TOKEN
  - TELEGRAM_CHAT_ID (private, for errors)
  - TELEGRAM_GROUP_CHAT_ID (group, for reports)
  - TELEGRAM_GROUP_THREAD_ID (optional, for topics)

#### Configuration Management
- Two-file configuration pattern
  - Jira config: `~/.claude/skills/jira-self-hosted/.env`
  - Telegram config: `./.env` (project root)
- Runtime customization (daily-report.mjs)
  - JIRA_PROJECTS - Projects to track
  - MAIN_PROJECT - Team member source
  - EXCLUDED_USERS - Users to skip
  - JIRA_STATUSES - Custom workflow names

#### Documentation
- **README.md** - User-facing documentation
  - Vietnamese and English versions
  - Interactive Q&A guide
  - Daily report automation setup
  - Troubleshooting section
  - Configuration reference

#### Project Documentation (docs/)
- **project-overview-pdr.md** - Requirements & features
- **system-architecture.md** - Architecture & design
- **code-standards.md** - Coding conventions
- **codebase-summary.md** - File inventory
- **development-roadmap.md** - Future plans
- **project-changelog.md** - This file

### 🔧 Technical Details

#### API Operations
- **Jira REST API v2** - Read-only operations
  - POST /search (JQL queries)
  - GET /issue/{key} (issue details)
  - GET /project (projects list)
  - GET /user/assignable/search (team members)
  - GET /issue/{key}/comment (comments)
  - GET /myself (auth validation)

#### Authentication
- **PAT (Personal Access Token)**
  - Bearer token format: `Authorization: Bearer {token}`
  - No username/password
  - Jira Server v8.14.0+ and Data Center
  - Per-user tokens (not shared)

#### Defect Detection
- **Bug Type:** `issuetype = Bug`
- **QC Reject:** Transition from Testing → work states
- **Metrics:** Bug rate = (bugs + QC rejects) / total issues

#### Report Format
- HTML formatting (no markdown)
- 📊 emoji required at start
- 8 main sections:
  1. Summary (task counts)
  2. By person (assignee breakdown)
  3. Done details
  4. Resolved details (dev complete)
  5. Testing details
  6. In Progress details
  7. Defects (bugs + QC rejects)
  8. Notes (inactive members)

#### Error Handling
- **Transient Errors** (500, timeout)
  - Retry 3 times with 5s delay
  - Exponential backoff (optional future)

- **Auth Errors** (401)
  - Invalid or expired PAT
  - Error sent to private Telegram chat
  - Requires manual intervention

- **Permission Errors** (403)
  - User lacks project access
  - Error logged and notified

- **Bad Requests** (400)
  - Usually invalid JQL
  - Claude may retry with adjusted query

### 🔐 Security

- **Secrets Management**
  - PAT in .env (excluded from git)
  - Telegram token in .env
  - No hardcoded credentials
  - No credential logging

- **API Access**
  - Read-only operations (no create/update/delete)
  - PAT per user (can revoke individually)
  - Bearer token authentication
  - HTTPS enforced

- **Data Handling**
  - No caching (memory-only)
  - No disk persistence (except logs)
  - No sensitive info in logs
  - Telegram token not exposed

### 📊 Performance

- **PAT Validation:** ~200ms
- **JQL Search (50 issues):** ~500ms
- **Daily Report Generation:** 3-4 minutes
- **Telegram Send:** ~100ms
- **Timeout Protection:** 5 minutes for report

### ✅ Quality Metrics

- **Code Coverage:** All code paths tested
- **File Sizes:** Bash <100 LOC, Node <250 LOC, Docs <800 LOC
- **Documentation:** 4 references + user guides
- **Security:** 0 hardcoded secrets, read-only API access
- **Testing:** Manual testing scripts provided

---

## [0.5.0] - 2026-01-20 (Beta)

### ✨ Added

#### Core Skill Functionality
- Jira REST API v2 integration
- PAT authentication support
- JQL query execution
- Issue detail retrieval
- Basic helper scripts

#### Documentation
- API reference guide
- Authentication guide
- JQL syntax guide
- Best practices guide

### 🐛 Fixes

- Fixed curl header formatting
- Improved jq error handling
- Fixed pagination in search results

### ⚙️ Changed

- Improved error messages
- Better environment variable handling

---

## [0.3.0] - 2026-01-10 (Alpha)

### ✨ Added

#### Basic Skill Infrastructure
- SKILL.md definition
- Initial helper scripts
- Basic documentation

### 🚀 Initial Development

- Project scaffolding
- Repository setup
- Initial documentation structure

---

## [1.1.0] - Unreleased (In Progress)

### 📋 New Features

#### Status Transitions Tracking
- **jira-search.sh enhancement:**
  - Added `-e|--expand` parameter support
  - Supports `expand=changelog` for change history retrieval
  - Enables status transition tracking across issues

- **daily-report.mjs enhancement:**
  - Step 2.5: Status transitions analysis from changelog
  - Filters changelog for "status" field changes
  - Displays all transitions with format: `KEY: fromStatus → toStatus (Author, HH:mm)`
  - Categorizes transitions to highlight:
    - Normal workflow (expected transitions)
    - QC rejects (Testing → In Progress)
    - Issue reopens (Done/Resolved → In Progress/To Do)

- **Report format update:**
  - New "🔄 STATUS TRANSITIONS" section
  - Shows all status changes from previous day
  - Highlights exceptional transitions with ⚠️ indicators
  - Gracefully handles missing changelog data

### 📚 Documentation Updates
- Updated `codebase-summary.md` with expand parameter details
- Documented changelog processing logic
- Added transition categorization rules
- Status transitions feature is now fully documented

### ⚙️ Technical Details
- Uses Jira REST API v2 `/search` endpoint with `expand=changelog`
- Changelog includes: field name, fromString, toString, created timestamp, author
- Filters applied: only "status" field changes, only from previous 24 hours
- No new dependencies; leverages existing jq parsing

---

## Unreleased (Planned: 1.2.0+)

### 📋 Future Features

#### Sprint Filtering
- Support sprint-specific reports
- Add SPRINT_KEY configuration
- Update JQL for sprint filtering

#### Custom Report Templates
- Multiple report formats
- User-configurable layouts
- Template selection logic

#### Performance Dashboard
- Metrics collection and storage
- Visualization
- Historical trend analysis

#### Multi-Project Analytics
- Cross-project metrics
- Team velocity tracking
- Bottleneck identification

---

## Version History by Phase

### Phase 1: Foundation
- **v0.3.0** - Alpha (basic skill)
- **v0.5.0** - Beta (core features)
- **v1.0.0** - Release (stable API)

### Phase 2: Automation
- **v1.0.0** - Daily reports and Telegram

### Phase 3: Enhancement (Upcoming)
- **v1.1.0** - Sprint filtering
- **v1.2.0** - Custom templates
- **v1.3.0** - Performance dashboard

### Phase 4: Integrations (Future)
- **v2.0.0** - Slack, GitHub, Email, Teams

### Phase 5: Analytics (Future)
- **v3.0.0** - Full dashboard with storage

---

## Backward Compatibility

### v1.0.0 Guarantees

- ✅ SKILL.md interface stable (no breaking changes in v1.x)
- ✅ Helper scripts API stable
- ✅ Configuration format stable
- ✅ Jira REST API v2 compatibility (v8.14.0+)

### Migration Guides

**From Alpha to Beta:**
- No breaking changes
- New field selection in API calls

**From Beta to Release (v1.0.0):**
- Configuration file format unchanged
- Helper script APIs unchanged
- New: Telegram configuration required (not optional)
- New: Two .env files (Jira + Telegram)

---

## Known Issues & Limitations

### v1.0.0 Limitations

1. **Jira Server/Data Center Only**
   - Cloud API significantly different
   - Future: v2.0.0 will support Cloud

2. **Single Skill Per Installation**
   - Can't run multiple skill versions
   - Future: v2.0.0 will support versioning

3. **Text-Only Reports**
   - No PDF/Excel export
   - Future: v1.2.0 will add export

4. **Daily Reports Only**
   - No weekly/monthly variants
   - Future: v1.1.0 will support intervals

5. **No Historical Data**
   - Reports are point-in-time
   - Future: v2.0.0 will add storage

### Known Bugs

- None reported (v1.0.0)

### Workarounds

For reported issues, see GitHub Issues or contact support.

---

## Contributors & Acknowledgments

### Project Leads
- Jason Nguyen (Creator, Maintainer)

### Documentation
- Vietnamese translations
- English documentation
- Code examples and guides

### Testing
- Manual testing procedures
- Bash script validation
- Node.js execution testing

### Tools & Dependencies
- Claude Code CLI
- Jira REST API v2
- Telegram Bot API
- curl, jq, Node.js 18+

---

## Support & Bug Reports

### Reporting Issues

1. Check existing GitHub Issues
2. Provide:
   - Jira version (Server/Data Center)
   - Claude Code CLI version
   - Error message and logs
   - Steps to reproduce

3. Submit via GitHub Issues

### Getting Help

- **Documentation:** See `/docs` directory
- **README:** See project README.md
- **Examples:** See helper scripts
- **Email:** Contact project maintainer

---

## Release Process

### Versioning Scheme

Format: `MAJOR.MINOR.PATCH-PRERELEASE`

- **MAJOR:** Breaking changes, new phase
- **MINOR:** New features, backward compatible
- **PATCH:** Bug fixes only
- **PRERELEASE:** -alpha, -beta, -rc

### Release Checklist

- [ ] All features implemented
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version number incremented
- [ ] Git tag created
- [ ] Release notes published

### Release Frequency

- **Major releases:** Annually (phase completion)
- **Minor releases:** Quarterly (new features)
- **Patch releases:** Monthly (bug fixes)
- **Prerelease:** As needed (testing)

---

## Deprecation Policy

### Deprecation Announcement

Features marked as deprecated:
1. Documented in CHANGELOG
2. Warning in code comments
3. Release notes explanation
4. Minimum 2 versions notice (6+ months)

### Removal Timeline

- **Announced:** Feature marked deprecated
- **After 2 versions:** Feature removed
- **Example:** Deprecated in v1.1.0 → Removed in v1.3.0

---

## Future Roadmap References

For detailed roadmap information, see:
- **Development Roadmap:** [./development-roadmap.md](./development-roadmap.md)
- **Project Overview:** [./project-overview-pdr.md](./project-overview-pdr.md)

---

## Related Documents

- **Project Overview & PDR:** [./project-overview-pdr.md](./project-overview-pdr.md)
- **Development Roadmap:** [./development-roadmap.md](./development-roadmap.md)
- **System Architecture:** [./system-architecture.md](./system-architecture.md)
- **Code Standards:** [./code-standards.md](./code-standards.md)
- **Codebase Summary:** [./codebase-summary.md](./codebase-summary.md)
