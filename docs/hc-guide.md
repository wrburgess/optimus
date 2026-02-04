# Human Collaborator (HC) Guide

This guide is for developers working on MPI Rails applications alongside AI collaborators (ACs). It covers your role in the development workflow, how to direct AI agents, what to review, and how to set up your environment.

For the full infrastructure reference (AC configuration, CI/CD internals, repository map), see [docs/architecture/mpi-infrastructure.md](architecture/mpi-infrastructure.md).

## Terminology

| Term | Meaning |
|------|---------|
| **HC** | Human Collaborator — you |
| **AC** | AI Collaborator — any AI agent (Claude Code, GitHub Copilot) |
| **CC** | Claude Code — the primary AC for development work |
| **CDX** | GitHub Copilot — automated PR reviewer and IDE assistant |

## Your Role

You are the decision-maker. ACs propose, you choose. ACs implement, you verify. ACs review code, you review business logic and UX. The workflow is designed so that ACs handle the mechanical work while you focus on judgment calls that require domain knowledge, user empathy, and architectural vision.

Specifically, you:

- **Create issues** describing what needs to be built or fixed
- **Choose options** when the AC presents alternatives
- **Approve plans** before implementation starts
- **Review PRs** for business correctness, UX, and things ACs miss
- **Request merges** when satisfied with the work
- **Merge PRs** into `main`

## Development Workflow

This is the standard flow for every feature or bug fix:

```
1. You create a GitHub Issue
       |
2. You run: /revi NNN
   AC analyzes the issue, asks clarifying questions,
   posts an assessment with options on the Issue
       |
3. You choose an option (comment on the Issue)
       |
4. You run: /cplan NNN
   AC creates an implementation plan and posts it on the Issue
       |
5. You approve the plan (comment on the Issue)
       |
6. You run: /impl NNN
   AC creates a branch, writes code + tests,
   runs all quality checks, opens a PR
       |
7. Copilot automatically reviews the PR
   (P0/P1/P2 findings posted as review comments)
       |
8. You run: /rtr NNN
   AC reads the review, categorizes comments,
   proposes resolutions for you to choose from
       |
9. You choose which comments to address
       |
10. AC makes changes, pushes, replies to review comments
        |
11. You review the PR yourself (see "What to Review" below)
        |
12. You run: /final NNN
    AC rebases, verifies CI, posts Statement of Work on PR
        |
13. You merge the PR → Issue closed
```

### For Larger Work

If the plan involves many files or independent subsystems, you can use:

- `/esti NNN` — AC evaluates whether single or parallel agents are optimal
- `/orch NNN` — AC designs a multi-agent orchestration plan with work streams and file ownership

## Commands Reference

Run these as slash commands in Claude Code CLI:

### Core Workflow

| Command | Phase | What It Does |
|---------|-------|--------------|
| `/revi NNN` | Research | Analyze issue, post assessment + options |
| `/cplan NNN` | Plan | Create implementation plan from chosen option |
| `/impl NNN` | Execute | Implement plan, create branch, write code, open PR |
| `/rtr NNN` | Execute | Read and respond to PR review comments |
| `/final NNN` | Execute | Rebase, verify CI, post SOW, prepare for merge |

### Supporting Commands

| Command | What It Does |
|---------|--------------|
| `/esti NNN` | Determine single vs parallel agent strategy |
| `/orch NNN` | Design multi-agent work streams |
| `/explore TOPIC` | Deep-dive into a codebase area |
| `/compare REPO` | Diff standards against another MPI repo |
| `/dep-review NNN` | Review a dependency update PR |
| `/db-health` | Run database health diagnostics |

### Quick Examples

```bash
# Start working on issue #42
/revi 42              # AC posts analysis and options
# (you comment: "Option B")
/cplan 42             # AC posts plan
# (you comment: "Approved")
/impl 42              # AC implements, opens PR

# After Copilot reviews the PR
/rtr 42               # AC categorizes review, proposes fixes
# (you choose what to address)

# When ready to merge
/final 42             # AC rebases, verifies CI, posts SOW
# (you merge on GitHub)
```

## What to Review

ACs are good at writing correct code, following patterns, and catching syntax issues. They are less reliable at business logic, UX coherence, and production-scale concerns. Focus your review on what ACs miss.

### Business Logic

- Does the implementation match the actual business requirement?
- Are edge cases from real-world usage handled?
- Do notification messages and permission names make sense to end users?

### User Experience

- Do flash messages read naturally?
- Are form labels clear to non-technical users?
- Is the sort order on index pages sensible?
- Is the show page layout logical — most important fields first?

### Data Integrity

- Are `dependent:` options correct? (`:destroy` vs `:nullify` vs `:restrict_with_error`)
- Do validations match actual business constraints?
- Could a migration fail on existing production data?

### Security

- Is authorization checking the right permission (not just present)?
- Are Ransack search attributes appropriately scoped?

### Agent-Specific Concerns

- Did the AC follow existing patterns or introduce new ones without justification?
- Is the AC attribution present on all commits?
- Did the AC over-engineer? (Extra abstractions, defensive code for impossible states)
- Are there "AI-isms"? (Overly verbose comments, unnecessary nil checks, generic error messages)

### Before Approving

- Pull the branch and run `bin/dev` — does the page actually work?
- Click through the UI flow manually
- Check the browser console for JavaScript errors
- Verify the page looks correct on a narrow viewport

See [docs/standards/hc-review-checklist.md](standards/hc-review-checklist.md) for the full checklist.

## Pre-Commit Requirements

Whether you commit code yourself or direct an AC to do it, every commit must pass these four checks:

```bash
bundle exec rubocop -a       # Lint and auto-correct
bundle exec rspec             # Full test suite
bin/brakeman --no-pager -q    # Security static analysis
bin/bundler-audit check       # Vulnerable dependency check
```

No exceptions. CI runs the same checks — if it passes locally, it passes in CI.

## Review Severity Levels

When Copilot or Claude Code reviews a PR, findings use these severity levels:

| Level | Meaning | Action |
|-------|---------|--------|
| **P0 — Must Fix** | Security, correctness, data integrity | Block merge until resolved |
| **P1 — Should Fix** | Performance, patterns, coverage | Fix before merge in most cases |
| **P2 — Consider** | Style, naming, edge cases | Address at your discretion |

## Branch Permissions

ACs operate under branch-based permissions:

- **Feature branches** — ACs have full autonomy (commit, edit, refactor without asking)
- **`main` branch** — ACs must ask before any change

This means once you approve a plan and run `/impl`, the AC will work independently on a feature branch without pausing to ask permission at every step.

## Environment Setup

### 1. Clone and install

```bash
git clone git@github.com:mpimedia/optimus.git
cd optimus
bin/setup                     # Bundle install, db:prepare, assets, clear
```

### 2. Runtime versions

Install [asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev/), then:

```bash
asdf install                  # Installs Ruby, Node, PostgreSQL, Yarn from .tool-versions
```

### 3. Claude Code setup

```bash
# MCP servers (Context7, GitHub, Heroku)
cp .mcp.json.example .mcp.json
# Fill in your API keys

# Claude Code plugins
claude plugin marketplace add boostvolt/claude-code-lsps
claude plugin install solargraph@claude-code-lsps

# Enable LSP (add to ~/.zshrc or ~/.bashrc)
export ENABLE_LSP_TOOL=1
```

### 4. Personal AC settings (optional)

Create `.claude/settings.local.json` for personal Claude Code permissions beyond the shared defaults. This file is gitignored.

### 5. Development server

```bash
bin/dev                       # Starts web server, JS/CSS watchers, background worker
```

This runs `foreman` with `Procfile.development` on port 8000.

## Related Documentation

| Document | What It Covers |
|----------|---------------|
| [MPI Infrastructure Guide](architecture/mpi-infrastructure.md) | Full infrastructure reference (repos, AC config, CI/CD, quality tooling) |
| [Architecture Overview](architecture/overview.md) | Optimus-specific models, controllers, patterns |
| [Agent Workflow](architecture/agent-workflow.md) | AC roles, multi-agent patterns, Copilot setup |
| [HC Review Checklist](standards/hc-review-checklist.md) | Detailed review checklist for HC PR reviews |
| [Testing Standards](standards/testing.md) | RSpec conventions, factory patterns, shared contexts |
| [Code Review Standards](standards/code-review.md) | Review checklist for all reviewers |
| [Style Standards](standards/style.md) | Ruby, CSS, JS, ERB conventions |
| [Cross-Repo Sync](standards/cross-repo-sync.md) | How standards stay aligned across MPI apps |
