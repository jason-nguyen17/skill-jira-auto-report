# Documentation Index

**Project:** skill-jira-auto-report
**Version:** 1.0.0
**Last Updated:** 2026-02-05

Welcome to the skill-jira-auto-report documentation. This index helps you find the right document based on your role and needs.

---

## Quick Navigation by Role

### 👨‍💻 Developer

**Getting Started (30 minutes)**
1. Read: [README.md](../README.md) - Quick start guide
2. Run: `./install-skill.sh`
3. Read: [Code Standards](./code-standards.md) - Before writing code
4. Reference: `skills/jira-self-hosted/references/` - API & JQL guides

**Understanding the System (2-3 hours)**
1. Study: [System Architecture](./system-architecture.md) - How everything works
2. Reference: [Codebase Summary](./codebase-summary.md) - File-by-file breakdown
3. Check: [Code Standards](./code-standards.md) - Conventions & patterns

**Implementing Features**
1. Check: [Development Roadmap](./development-roadmap.md) - What's planned
2. Reference: [System Architecture](./system-architecture.md) - Where to add code
3. Follow: [Code Standards](./code-standards.md) - Quality requirements

---

### 🏗️ System Architect / Maintainer

**Project Overview (1 hour)**
1. Start: [Project Overview & PDR](./project-overview-pdr.md) - Requirements & features
2. Deep dive: [System Architecture](./system-architecture.md) - Architecture & design
3. Check: [Codebase Summary](./codebase-summary.md) - Implementation details

**Planning Changes**
1. Review: [Development Roadmap](./development-roadmap.md) - Strategic direction
2. Reference: [System Architecture](./system-architecture.md) - Integration points
3. Check: [Project Changelog](./project-changelog.md) - Recent changes

**Troubleshooting Issues**
1. Check: [System Architecture](./system-architecture.md) - Failure modes & recovery
2. Reference: [Codebase Summary](./codebase-summary.md) - Component interactions
3. Consult: `skills/jira-self-hosted/references/best-practices.md` - Error handling

---

### 📊 Product Manager

**Project Status (1 hour)**
1. Overview: [Project Overview & PDR](./project-overview-pdr.md) - What we're building
2. Roadmap: [Development Roadmap](./development-roadmap.md) - Timeline & phases
3. Changes: [Project Changelog](./project-changelog.md) - Releases & history

**Feature Planning**
1. Requirements: [Project Overview & PDR](./project-overview-pdr.md) - PDR section
2. Roadmap: [Development Roadmap](./development-roadmap.md) - Future phases
3. Metrics: [Project Overview & PDR](./project-overview-pdr.md) - Success metrics

**Tracking Progress**
1. Roadmap: [Development Roadmap](./development-roadmap.md) - Phase status
2. Changelog: [Project Changelog](./project-changelog.md) - What shipped
3. Metrics: [Project Overview & PDR](./project-overview-pdr.md) - KPIs

---

### 🔍 Code Reviewer

**Before Reviewing Code**
1. Standards: [Code Standards](./code-standards.md) - What to check for
2. Architecture: [System Architecture](./system-architecture.md) - Boundaries
3. Summary: [Codebase Summary](./codebase-summary.md) - Affected files

**During Review**
1. Reference: [Code Standards](./code-standards.md) - Quality checklist
2. Check: [System Architecture](./system-architecture.md) - Integration impact
3. Verify: Code follows established patterns

**Commenting on Changes**
1. Standards: [Code Standards](./code-standards.md) - Convention references
2. Architecture: [System Architecture](./system-architecture.md) - Design rationale
3. Roadmap: [Development Roadmap](./development-roadmap.md) - Strategic fit

---

## Documents by Type

### 📋 Requirements & Planning
- **[Project Overview & PDR](./project-overview-pdr.md)** (406 LOC)
  - Features overview
  - Complete requirements (functional & non-functional)
  - Acceptance criteria
  - Success metrics
  - Architecture overview

### 🏗️ Architecture & Design
- **[System Architecture](./system-architecture.md)** (878 LOC)
  - Layer architecture (6 layers)
  - Data flow sequences
  - Component interactions
  - Security architecture
  - Failure handling
  - Performance characteristics
  - Extensibility points

### 💻 Code & Standards
- **[Code Standards](./code-standards.md)** (878 LOC)
  - File organization
  - Naming conventions
  - Bash script standards
  - Node.js standards
  - Markdown standards
  - Security practices
  - Testing approach
  - Quality checklist

### 📦 Codebase Inventory
- **[Codebase Summary](./codebase-summary.md)** (482 LOC)
  - File inventory
  - Component breakdown
  - Key interfaces
  - Dependencies
  - Data flow diagrams
  - Code metrics
  - Security posture
  - Testing procedures

### 🚀 Roadmap & Progress
- **[Development Roadmap](./development-roadmap.md)** (554 LOC)
  - 5-phase roadmap
  - Phase details & features
  - Timeline & budget
  - Resource requirements
  - Risk analysis
  - Success criteria
  - Stakeholder communication
  - KPIs

### 📝 Release History
- **[Project Changelog](./project-changelog.md)** (495 LOC)
  - v1.0.0 release notes
  - Previous versions
  - Feature history
  - Backward compatibility
  - Known issues
  - Deprecation policy
  - Release process

---

## Documents by Topic

### Authentication & Security
| Topic | Document | Section |
|-------|----------|---------|
| PAT Setup | References | authentication.md |
| API Auth | Architecture | Authentication Method |
| Secrets | Code Standards | Security Standards |
| Data Protection | Architecture | Security Architecture |

### API & Integration
| Topic | Document | Section |
|-------|----------|---------|
| REST Endpoints | References | api-reference.md |
| JQL Syntax | References | jql-guide.md |
| API Contract | Architecture | API Layer |
| Integration | Architecture | External Integrations |

### Configuration
| Topic | Document | Section |
|-------|----------|---------|
| Environment | Code Standards | Configuration Management |
| Customization | Code Standards | File Organization |
| Team Setup | Codebase Summary | Configuration Flexibility |
| Workflow | Project Overview | Defect Detection Logic |

### Performance & Reliability
| Topic | Document | Section |
|-------|----------|---------|
| Latency | System Architecture | Performance Characteristics |
| Scaling | Codebase Summary | Performance Characteristics |
| Reliability | Project Overview | Non-Functional Requirements |
| Monitoring | System Architecture | Monitoring & Observability |

### Defect Handling
| Topic | Document | Section |
|-------|----------|---------|
| Detection | SKILL.md | Defect Detection Logic |
| Analytics | Development Roadmap | Phase 3: Enhancement |
| Metrics | Project Overview | Success Metrics |

---

## Quick Reference Tables

### File Organization
```
docs/
├── index.md                          # This file (navigation)
├── project-overview-pdr.md           # Features & requirements
├── system-architecture.md            # How it works
├── code-standards.md                 # Coding conventions
├── codebase-summary.md               # File inventory
├── development-roadmap.md            # Future plans
└── project-changelog.md              # Release history
```

### Document Relationships
```
README.md (entry point)
    ↓
project-overview-pdr.md (big picture)
    ├→ system-architecture.md (design)
    ├→ code-standards.md (how to code)
    ├→ codebase-summary.md (inventory)
    ├→ development-roadmap.md (future)
    └→ project-changelog.md (history)
```

### Content by Lines
| Document | LOC | Focus |
|----------|-----|-------|
| project-overview-pdr.md | 406 | Requirements |
| codebase-summary.md | 482 | Inventory |
| project-changelog.md | 495 | History |
| development-roadmap.md | 554 | Future |
| code-standards.md | 878 | Standards |
| system-architecture.md | 878 | Design |

---

## Accessing Skills & References

### Skill Definition
- **File:** `skills/jira-self-hosted/SKILL.md`
- **Purpose:** Claude Code skill interface definition
- **Contains:** When to use, implementation workflow, defect detection logic

### Reference Guides (for Claude context)
Located in `skills/jira-self-hosted/references/`:

| Guide | Purpose |
|-------|---------|
| api-reference.md | REST API v2 endpoints, request/response examples |
| authentication.md | PAT setup, Bearer token format, troubleshooting |
| jql-guide.md | JQL syntax, operators, date functions, examples |
| best-practices.md | Error handling, security, performance optimization |

### Helper Scripts
Located in `skills/jira-self-hosted/scripts/`:

| Script | Purpose |
|--------|---------|
| jira-auth-test.sh | Validate PAT connection |
| jira-search.sh | Execute JQL queries |
| jira-issue-get.sh | Fetch issue details |

---

## How to Use This Documentation

### For Questions About...

**"How does the system work?"**
→ [System Architecture](./system-architecture.md)

**"What should I code?"**
→ [Code Standards](./code-standards.md)

**"Which file does X?"**
→ [Codebase Summary](./codebase-summary.md)

**"What features exist?"**
→ [Project Overview & PDR](./project-overview-pdr.md)

**"What's coming next?"**
→ [Development Roadmap](./development-roadmap.md)

**"What changed?"**
→ [Project Changelog](./project-changelog.md)

**"How do I use the API?"**
→ `skills/jira-self-hosted/references/api-reference.md`

**"What's the JQL syntax?"**
→ `skills/jira-self-hosted/references/jql-guide.md`

**"How do I set up auth?"**
→ `skills/jira-self-hosted/references/authentication.md`

---

## Documentation Conventions

### Formatting
- **Headings:** Use `#` for major sections, `##` for subsections
- **Code:** Use syntax-highlighted blocks (bash, javascript, json, etc.)
- **Tables:** For structured comparisons
- **Lists:** For sequential or grouped items
- **Emphasis:** Use bold for **important** concepts

### Cross-References
- **Internal links:** `[text](./filename.md)` for same directory
- **Section links:** `[text](./file.md#section)` for specific sections
- **External links:** Full URLs for external resources

### Language
- **Vietnamese:** Main content, practical information
- **English:** Technical terms, code, examples
- **Bilingual:** README for both Vietnamese & English users

---

## Maintenance & Updates

### When to Update Documentation

| Trigger | Action | Document |
|---------|--------|----------|
| New feature | Add to roadmap → feature list | development-roadmap.md, project-changelog.md |
| Architecture change | Update diagrams & descriptions | system-architecture.md |
| Code standards | Update patterns & examples | code-standards.md |
| Bug fix | Note in changelog | project-changelog.md |
| Security issue | Update security sections | code-standards.md, system-architecture.md |

### Update Frequency

- **Weekly:** Check for accuracy issues
- **Monthly:** Update changelog with latest changes
- **Quarterly:** Review roadmap progress
- **Annually:** Full documentation audit

### Version Control

All documentation changes go through git:
```bash
git add docs/
git commit -m "docs: update system-architecture for feature X"
git push
```

---

## Getting Help

### Common Paths

**I'm new to the project**
1. Read: README.md (5 min)
2. Run: `./install-skill.sh` (1 min)
3. Test: `jira-auth-test.sh` (1 min)
4. Read: Codebase Summary (20 min)
5. Read: System Architecture (30 min)

**I need to understand the architecture**
1. Read: Project Overview & PDR (30 min)
2. Study: System Architecture (60 min)
3. Reference: Codebase Summary (30 min)

**I need to add a feature**
1. Check: Development Roadmap (10 min)
2. Plan: Project Overview & PDR (20 min)
3. Design: System Architecture (40 min)
4. Code: Follow Code Standards (20+ min)

**I need to review code**
1. Skim: Code Standards (5 min)
2. Reference: Specific sections as needed

**I need to report an issue**
1. Check: Project Changelog (5 min)
2. Search: Documentation for workarounds
3. Reference: System Architecture → Failure Modes

---

## Documentation Statistics

**Total Documentation:** 3,692 LOC
**Total Files:** 6 specialized docs + index
**Coverage:** 100% of project scope
**Average File Size:** 615 LOC (well under 800 LOC limit)
**Languages:** Vietnamese (primary) + English (reference)

---

## Related Resources

### External Documentation
- [Claude Code CLI Guide](https://github.com/anthropics/claude-code)
- [Jira REST API v2 Documentation](https://docs.atlassian.com/software/jira/docs/api/REST/9.0.0/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Bash Guide](https://www.gnu.org/software/bash/manual/)

### Project Resources
- **Repository:** GitHub repo (link in README)
- **Issues:** GitHub Issues (bug reports, features)
- **Discussions:** GitHub Discussions (Q&A)
- **Support:** Email or contact maintainer

---

**Last Updated:** 2026-02-05
**Next Review:** 2026-02-12
**Maintained By:** Documentation Team
