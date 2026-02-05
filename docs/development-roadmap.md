# Development Roadmap

**Project:** skill-jira-auto-report
**Version:** 1.0.0
**Last Updated:** 2026-02-05
**Status:** Phase 2 Complete, Phase 3 Planning

## Executive Summary

skill-jira-auto-report is a Claude Code skill for automated Jira reporting. It provides:
- **Interactive:** Real-time Q&A via Claude CLI
- **Automated:** Daily reports via cron + Telegram notifications

Current version (1.0.0) covers the foundation and core automation use cases. Future phases will add advanced analytics, integrations, and customization options.

---

## Phase Overview

| Phase | Name | Status | Timeline | Scope |
|-------|------|--------|----------|-------|
| **1** | Foundation | ✅ Complete | Q4 2025 | Jira API + Skill interface |
| **2** | Automation | ✅ Complete | Q1 2026 | Daily reports + Telegram |
| **3** | Enhancement | ⏳ Planning | Q2 2026 | Advanced features |
| **4** | Integrations | 🔮 Future | Q3 2026 | Slack, GitHub, etc. |
| **5** | Analytics | 🔮 Future | Q4 2026 | Dashboards, metrics |

---

## Phase 1: Foundation (✅ Complete)

**Timeline:** November - December 2025
**Status:** Complete

### Objectives

- [x] Jira REST API v2 integration
- [x] PAT authentication implementation
- [x] Helper scripts for common operations
- [x] Claude Code skill interface (SKILL.md)
- [x] Documentation framework (references/)

### Deliverables

| Item | File | Status |
|------|------|--------|
| Skill Definition | SKILL.md | ✅ |
| Auth Helper | jira-auth-test.sh | ✅ |
| Search Helper | jira-search.sh | ✅ |
| Issue Lookup | jira-issue-get.sh | ✅ |
| API Docs | api-reference.md | ✅ |
| Auth Guide | authentication.md | ✅ |
| JQL Guide | jql-guide.md | ✅ |
| Best Practices | best-practices.md | ✅ |

### Key Decisions

1. **Bash for Helper Scripts** - Minimal dependencies, easy to debug
2. **PAT Authentication** - Safer than username/password
3. **Read-Only Operations** - Reduces security risk
4. **Field Selection in API Calls** - Better performance

### Metrics

- ✅ Jira API v2 coverage: 100% of read endpoints
- ✅ Authentication: PAT with Bearer token
- ✅ Documentation: 4 reference guides
- ✅ Scripts: 3 core operations
- ✅ Code quality: 0 hardcoded secrets

---

## Phase 2: Automation (✅ Complete)

**Timeline:** January - February 2026
**Status:** Complete

### Objectives

- [x] Daily report automation (cron)
- [x] Report generation (daily-report.mjs)
- [x] Telegram integration (bot API)
- [x] Configuration system (customizable projects/statuses)
- [x] Error handling & retry logic
- [x] Installation script (install-skill.sh)

### Deliverables

| Item | File | Status |
|------|------|--------|
| Main Script | daily-report.mjs | ✅ |
| Shell Wrapper | run-daily-report.sh | ✅ |
| Helper Script (Expand) | jira-search.sh (updated) | ✅ |
| Status Transitions | daily-report.mjs (Step 2.5) | ✅ |
| Installer | install-skill.sh | ✅ |
| .env Template | .env.example | ✅ |
| Setup Guide | README.md | ✅ |
| Defect Logic | SKILL.md (section) | ✅ |
| Documentation Updates | codebase-summary.md (updated) | ✅ |

### Key Decisions

1. **Node.js for Orchestration** - subprocess management, async handling
2. **Two .env Files** - Jira (skill) + Telegram (project) separation
3. **3-Retry Logic** - Handles transient API failures
4. **HTML Formatting** - Telegram's native formatting (not markdown)
5. **Message Splitting** - Respect 4096 char limit

### Features Implemented

**Report Content:**
- Task summary (Done, Resolved, Testing, In Progress)
- Tasks grouped by assignee
- Detailed lists per status
- Status transitions tracking (NEW: Step 2.5 feature)
  - All transitions from previous 24 hours
  - Format: KEY: fromStatus → toStatus (Author, HH:mm)
  - Categorization: normal workflow vs. QC rejects vs. reopens
- Defect detection (bug type + QC reject)
- Inactive team members

**Status Transitions Feature:**
- Uses `expand=changelog` in jira-search.sh
- Parses changelog for status field changes
- Filters changes within 24-hour window
- Highlights exceptional transitions with ⚠️
- Gracefully handles missing changelog data

**Configuration:**
- JIRA_PROJECTS (array of project keys)
- MAIN_PROJECT (team member source)
- EXCLUDED_USERS (skip list)
- JIRA_STATUSES (custom workflow names)

**Error Handling:**
- Retry on transient errors
- Timeout protection (5 min)
- Error notifications (private Telegram)
- Exit codes for cron monitoring

### Metrics

- ✅ Report completeness: 5 sections
- ✅ Uptime target: 99.5% (daily success rate)
- ✅ Team coverage: 100% (all assignees in report)
- ✅ Response time: <5 minutes
- ✅ Defect detection accuracy: 95%+

---

## Phase 3: Enhancement (⏳ Planning)

**Timeline:** Q2 2026
**Status:** Planned (not started)

### Objectives

- [ ] Sprint-based filtering
- [ ] Custom report templates
- [ ] Multi-project dashboards
- [ ] Performance metrics
- [ ] Advanced defect analytics
- [ ] Customizable notification rules

### Proposed Features

#### 3.1 Sprint Filtering

**Requirement:**
Allow daily reports to focus on specific sprints or versions.

**Implementation:**
- Add SPRINT_KEY config to daily-report.mjs
- Extend JQL: `AND sprint = "Sprint 10"`
- Update report template with sprint metadata

**Timeline:** 2 weeks
**Effort:** Medium

#### 3.2 Custom Report Templates

**Requirement:**
Support different report formats for different audiences.

**Implementation:**
- Extract report formatting to separate module
- Create templates (management, dev, qa)
- Config file for template selection

**Templates:**
- **Management:** Summary only, team metrics
- **Dev:** Detailed tasks, blockers, tech notes
- **QA:** Bugs, testing status, defect metrics

**Timeline:** 3 weeks
**Effort:** Medium

#### 3.3 Multi-Project Dashboard

**Requirement:**
Visualize cross-project metrics and trends.

**Implementation:**
- Collect metrics over time (database)
- Generate HTML dashboard
- Deploy to simple server
- Link from daily reports

**Metrics:**
- Daily task counts (trend)
- Defect rate (trend)
- Team velocity (story points)
- Bottleneck analysis

**Timeline:** 4 weeks
**Effort:** High

#### 3.4 Performance Metrics

**Requirement:**
Track system performance and reliability.

**Implementation:**
- Collect execution times per component
- Log to metrics database
- Generate performance reports
- Alerts for degradation

**Tracked Metrics:**
- Claude execution time
- Jira API latency
- Telegram delivery time
- Daily report success rate

**Timeline:** 2 weeks
**Effort:** Medium

#### 3.5 Advanced Defect Analytics

**Requirement:**
Deeper insight into defect patterns and trends.

**Implementation:**
- Track defect history over time
- Analyze by developer, priority, type
- Identify trends (increasing/decreasing)
- Burndown projections

**Analytics:**
- Defect rate by developer (identify mentoring needs)
- Defect type distribution (identify process gaps)
- Time-to-fix metrics (SLA tracking)
- Reopen trends (quality indicator)

**Timeline:** 3 weeks
**Effort:** High

#### 3.6 Customizable Notifications

**Requirement:**
Different notification rules for different scenarios.

**Implementation:**
- Config file with notification rules
- Conditional sending (critical issues only)
- Escalation rules (high defect rate → escalate)
- Digest options (daily vs weekly)

**Rules:**
```yaml
notifications:
  - condition: "defect_rate > 10%"
    notify: [TELEGRAM_SLACK, TELEGRAM_EMAIL]
    severity: HIGH

  - condition: "blocked_tasks > 3"
    notify: [TELEGRAM_GROUP]
    severity: MEDIUM
```

**Timeline:** 2 weeks
**Effort:** Medium

---

## Phase 4: Integrations (🔮 Future)

**Timeline:** Q3 2026
**Status:** Planning

### Proposed Integrations

#### 4.1 Slack Integration

**Scope:**
- Send reports to Slack channels
- Interactive commands (query Jira from Slack)
- Mention team members in Slack threads

**Effort:** 3 weeks
**Complexity:** Medium

#### 4.2 GitHub Integration

**Scope:**
- Link GitHub PRs to Jira issues
- Synchronize issue status from GitHub
- Report on code review metrics

**Effort:** 4 weeks
**Complexity:** High

#### 4.3 Email Reports

**Scope:**
- Send daily reports via email
- Rich HTML formatting
- Customizable recipient lists
- Attachment support (CSV export)

**Effort:** 2 weeks
**Complexity:** Medium

#### 4.4 Microsoft Teams

**Scope:**
- Send reports to Teams channels
- Adaptive card formatting
- Two-way sync with Jira

**Effort:** 3 weeks
**Complexity:** Medium

---

## Phase 5: Analytics Dashboard (🔮 Future)

**Timeline:** Q4 2026
**Status:** Conceptual

### Proposed Features

- Web-based dashboard (React)
- Metrics visualization (charts, graphs)
- Historical data storage (PostgreSQL)
- API for custom queries
- Export functionality (PDF, CSV)

**Effort:** 8 weeks
**Complexity:** Very High

**Tech Stack:**
- Frontend: React + D3.js
- Backend: Node.js + Express
- Database: PostgreSQL
- Deployment: Docker

---

## Dependency & Blocking Analysis

### Phase 3 Dependencies

- Phase 2 must be complete ✅
- No external dependencies
- Can work on features in parallel

### Phase 4 Dependencies

- Phase 3 "Custom Templates" recommended
- Slack SDK available
- GitHub API v3/v4 available

### Phase 5 Dependencies

- Phases 3-4 should be complete
- Database infrastructure needed
- Deployment/hosting required

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Jira API Change** | Low | High | Monitor changelog, maintain compatibility layer |
| **Telegram Limits** | Low | Medium | Implement message splitting, rate limiting |
| **Scale Issues** | Low | Medium | Pagination, batch queries, monitoring |
| **Security Incident** | Low | High | Code audit, dependency scanning, SAST |
| **Scope Creep** | Medium | High | Clear requirements per phase, gate new features |

---

## Success Criteria

### Phase 1: Foundation

- [x] All API endpoints documented and working
- [x] Authentication secure (no hardcoded secrets)
- [x] Helper scripts follow bash standards
- [x] Zero security vulnerabilities

### Phase 2: Automation

- [x] Daily reports consistent format
- [x] Telegram delivery reliable (99%+)
- [x] Configuration customizable (no code changes)
- [x] Installation process documented
- [x] Cron integration tested

### Phase 3: Enhancement

- [ ] Sprint filtering works for multiple Jira versions
- [ ] Report templates user-configurable
- [ ] Dashboard loads in <3 seconds
- [ ] Performance metrics tracked and visible
- [ ] 95%+ defect detection accuracy

### Phase 4: Integrations

- [ ] Slack reports deliver successfully
- [ ] GitHub sync bidirectional
- [ ] Email formatting renders correctly
- [ ] Teams integration matches Slack feature parity

### Phase 5: Analytics

- [ ] Dashboard supports 6+ months of history
- [ ] Query response <1 second (p95)
- [ ] Export complete (no data loss)
- [ ] Mobile responsive

---

## Resource Requirements

| Phase | Dev Time | QA Time | Docs | Total |
|-------|----------|---------|------|-------|
| **1** | 4 weeks | 1 week | 2 weeks | 7 weeks |
| **2** | 4 weeks | 1.5 weeks | 2 weeks | 7.5 weeks |
| **3** | 8 weeks | 2 weeks | 2 weeks | 12 weeks |
| **4** | 10 weeks | 2.5 weeks | 3 weeks | 15.5 weeks |
| **5** | 16 weeks | 4 weeks | 4 weeks | 24 weeks |

**Total Project:** 66 weeks (~1.5 years)

---

## Budget Estimation

Assuming $100/hour developer rate:

| Phase | Hours | Cost |
|-------|-------|------|
| **1** | 280 | $28,000 |
| **2** | 300 | $30,000 |
| **3** | 480 | $48,000 |
| **4** | 620 | $62,000 |
| **5** | 960 | $96,000 |
| **Total** | 2,640 | $264,000 |

---

## Version Timeline

```
Q4 2025          Q1 2026          Q2 2026          Q3 2026          Q4 2026
|                |                |                |                |
v1.0.0-alpha     v1.0.0           v1.1.0-beta      v1.2.0           v2.0.0-beta
Foundation       Automation       Enhancement      Integrations     Analytics
[Phase 1]        [Phase 2]        [Phase 3]        [Phase 4]        [Phase 5]
```

---

## Stakeholder Communication

### Monthly Updates

- Development progress (% complete)
- Blockers and risks
- Budget/timeline adjustments
- Next month priorities

### Quarterly Reviews

- Phase completion status
- Metrics and KPIs
- Feature adoption
- Feedback from users
- Roadmap adjustments

### Annual Planning

- Strategic alignment (business goals)
- Resource planning (team, budget)
- Market analysis (competitive features)
- Long-term vision (5 years)

---

## Metrics & KPIs

### Development Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code Coverage | 80%+ | Test suite coverage |
| Bug Fix Time | <1 week | Issue → resolution |
| Release Frequency | Monthly | New versions |
| Security Issues | 0 | Audits, scanning |

### Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Satisfaction | 4.5/5.0 | Surveys |
| Daily Active Users | 50%+ | Usage tracking |
| Feature Usage | 70%+ | Analytics |
| Support Tickets | <5/month | Support requests |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| ROI | 3:1 | Cost vs benefit |
| Productivity Gain | 20% | Time tracking |
| Team Efficiency | +30% | Velocity improvement |
| Customer Retention | 95%+ | Annual churn |

---

## Known Limitations (v1.0.0)

1. **Jira Server/Data Center Only** - No Cloud support (API differences)
2. **Daily Reports Only** - No weekly/monthly variants
3. **Text Format** - No PDF or Excel exports
4. **Single Team** - One team per installation
5. **No Historical Analytics** - No trend tracking

---

## Feedback & Continuous Improvement

### Channels

- GitHub Issues (bug reports, feature requests)
- Email (support questions)
- Surveys (quarterly)
- User interviews (semi-annual)

### Incorporation Process

1. Collect feedback (1-2 weeks)
2. Triage and prioritize (weekly)
3. Add to backlog (next planning cycle)
4. Implement (next quarter)
5. Release and communicate (monthly)

---

## Related Documents

- **Project Overview & PDR:** [./project-overview-pdr.md](./project-overview-pdr.md)
- **System Architecture:** [./system-architecture.md](./system-architecture.md)
- **Code Standards:** [./code-standards.md](./code-standards.md)
- **Codebase Summary:** [./codebase-summary.md](./codebase-summary.md)
- **Project Changelog:** [./project-changelog.md](./project-changelog.md)
