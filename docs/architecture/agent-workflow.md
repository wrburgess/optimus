# Agent Workflow Architecture

This document describes how AI agents (Claude Code, Copilot) interact in the MPI development workflow.

## Agent Roles

| Agent | Role | Trigger |
|-------|------|---------|
| **Claude Code (CC)** | Primary development agent — analyzes issues, plans, implements, creates PRs | Human invokes via CLI commands |
| **GitHub Copilot** | Automated PR reviewer and inline code assistant | Automatic on PR creation via repository settings, or IDE integration |

## Workflow

```
1. HC creates GitHub Issue
        │
2. CC analyzes issue (/project:revi NNN)
   ├── Asks clarifying questions
   └── Posts assessment + options on Issue
        │
3. HC chooses option
        │
4. CC creates plan (/project:cplan NNN)
   └── Posts plan on Issue
        │
5. HC approves plan
        │
6. CC implements (/project:impl NNN)
   ├── Creates branch (or worktree via wt)
   ├── Writes code + tests
   ├── Runs rubocop + rspec
   ├── Creates PR with implementation notes
   └── Posts brief link on Issue
        │
7. Copilot auto-reviews the PR
   └── Posts code review with P0/P1/P2 findings
        │
8. CC reads Copilot review (/project:rtr NNN)
   ├── Categorizes comments
   ├── Proposes resolutions
   └── Presents options to HC
        │
9. HC chooses option
        │
10. CC addresses review comments
    ├── Makes changes
    ├── Runs rubocop + rspec
    ├── Pushes to PR
    └── Replies to review comments
        │
11. HC requests merge
        │
12. CC finalizes (/project:final NNN)
    ├── Rebases, verifies CI
    ├── Posts SOW on PR
    └── Notifies HC ready for merge
        │
13. HC merges PR → Issue closed
```

## Configuration Files

| File | Agent | Purpose |
|------|-------|---------|
| `CLAUDE.md` | Claude Code | Primary instructions, patterns, commands, architecture |
| `AGENTS.md` | All agents | Universal agent instructions, review guidelines, architecture |
| `.github/copilot-instructions.md` | GitHub Copilot | Copilot-specific instructions and patterns |
| `.claude/settings.json` | Claude Code | Permissions, hooks configuration |
| `.claude/commands/*.md` | Claude Code | Reusable workflow command templates |

## Review Severity Levels

Automated reviewers use severity levels defined in `AGENTS.md`:

- **P0 — Must Fix**: Security vulnerabilities, missing authorization, broken tests, credentials in code, data loss risks
- **P1 — Should Fix**: N+1 queries, missing validations, pattern violations, missing tests, exposed Ransack attributes
- **P2 — Consider**: Naming, organization, performance, edge cases

Copilot flags issues based on `.github/copilot-instructions.md` and the severity definitions in `AGENTS.md`.

## Agent Attribution

Every agent must include attribution on all work. This is enforced by `CLAUDE.md`, `AGENTS.md`, and `.github/copilot-instructions.md`:

```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
Co-Authored-By: GitHub Copilot <noreply@github.com>
```

## GitHub Copilot Code Review Setup

### Prerequisites

- GitHub Copilot enabled for the repository (requires a Copilot Business or Enterprise plan, or individual Pro plan)
- `.github/copilot-instructions.md` committed to the repository with project-specific guidance

### Enable Automatic PR Review

1. Go to repository **Settings → Copilot → Code review**
2. Enable **automatic code review** for pull requests
3. Copilot reads `.github/copilot-instructions.md` for project-specific patterns and review criteria

### Manual Review Trigger

Request a Copilot review on any PR through the GitHub UI:

1. Open the PR on GitHub
2. Click **Reviewers** in the sidebar
3. Select **Copilot** from the reviewer list

Or use the GitHub CLI:

```bash
gh pr edit NNN --add-reviewer copilot
```

### What Copilot Reviews

Copilot evaluates PRs against:

- `.github/copilot-instructions.md` — project-specific patterns, architecture, conventions
- General code quality — security, performance, correctness
- The severity levels defined in `AGENTS.md` (P0/P1/P2)

## Multi-Agent Patterns

### When to Use Multiple Agents

| Scenario | Strategy | Example |
|----------|----------|---------|
| Small feature (< 5 files) | Single agent, simple branch | Add a field to a form |
| Medium feature (5-15 files) | Single agent, evaluate worktree | New CRUD resource |
| Large feature (15+ files, independent subsystems) | Parallel agents via worktrees | New module with models, controllers, views, specs |
| Urgent hotfix alongside feature work | Worktree for isolation | Fix bug on main while feature branch continues |

### Parallel Agent Workflow

When a plan calls for parallel agents, use the `/project:orch NNN` command to generate an orchestration plan. The workflow is:

```
1. HC approves plan with parallel strategy
        │
2. CC creates orchestration plan (/project:orch NNN)
   ├── Defines work streams with exclusive file ownership
   ├── Creates worktrees via wt create <branch>
   └── Posts orchestration plan on Issue
        │
3. HC approves orchestration plan
        │
4. Agents execute in parallel
   ├── Agent A: Stream 1 (e.g., models + migrations)
   ├── Agent B: Stream 2 (e.g., controllers + views)
   └── Each agent runs pre-commit checks on their scope
        │
5. Integration
   ├── First stream merges to integration branch
   ├── Subsequent streams rebase and merge
   ├── Full test suite runs on integrated code
   └── Single PR created from integration branch
        │
6. Normal review flow continues (Copilot review → rtr → final)
```

### File Ownership Rules

When multiple agents work in parallel, conflicts are prevented through exclusive file ownership:

- **No two agents modify the same file** — if they must, one owns it and the other waits
- **Shared interfaces are defined upfront** — method signatures, model attributes, route paths
- **Database migrations belong to one stream** — typically the model/data stream
- **Spec files follow their source** — the agent that writes `app/models/foo.rb` also writes `spec/models/foo_spec.rb`

### Worktree vs Worktrunk Decision

| Tool | When to Use |
|------|-------------|
| `git worktree add` | One-off isolation, simple parallel work |
| `wt create` (Worktrunk) | Multi-agent work needing shared hooks, config, and commit message generation |
| Simple branch | Single agent, single focus, no isolation needed |

### Agent Communication

Agents coordinate through:

1. **Issue comments** — orchestration plan defines contracts between streams
2. **Shared interface definitions** — method signatures and expected behavior documented before work starts
3. **Completion signals** — each agent commits and pushes when their stream is done
4. **Integration agent** — one agent (usually Main) handles merging all streams

## Command Quick Reference

| Command | Abbreviation | Purpose |
|---------|-------------|---------|
| `/project:research/review-issue NNN` | `/project:revi NNN` | Analyze issue, propose options |
| `/project:research/explore-codebase TOPIC` | `/project:explore TOPIC` | Explore codebase area |
| `/project:plan/create-plan NNN` | `/project:cplan NNN` | Create implementation plan |
| `/project:plan/estimate-agents NNN` | `/project:esti NNN` | Determine agent strategy |
| `/project:execute/implement NNN` | `/project:impl NNN` | Execute plan, create PR |
| `/project:execute/respond-to-review NNN` | `/project:rtr NNN` | Read and respond to review |
| `/project:execute/finalize-pr NNN` | `/project:final NNN` | Post SOW, prepare for merge |
| `/project:plan/orchestrate NNN` | `/project:orch NNN` | Design multi-agent orchestration |
| `/project:research/compare-standards REPO` | `/project:compare REPO` | Diff standards against another repo |
| `/project:dep-review NNN` | — | Review Dependabot/dependency update PR |
| `/project:db-health` | — | Run database health diagnostics |

### Command Aliases

Abbreviated commands (e.g., `/project:revi`) are **identical copies** of their full-path versions (e.g., `/project:research/review-issue`). Both forms are interchangeable — use abbreviations for daily work and full paths when referencing commands in documentation.

The top-level files in `.claude/commands/` are aliases:

| Alias | Full Path |
|-------|-----------|
| `revi.md` | `research/review-issue.md` |
| `explore.md` | `research/explore-codebase.md` |
| `compare.md` | `research/compare-standards.md` |
| `cplan.md` | `plan/create-plan.md` |
| `esti.md` | `plan/estimate-agents.md` |
| `orch.md` | `plan/orchestrate.md` |
| `impl.md` | `execute/implement.md` |
| `rtr.md` | `execute/respond-to-review.md` |
| `final.md` | `execute/finalize-pr.md` |

`dep-review.md` and `db-health.md` are standalone utility commands with no subdirectory equivalent.

When updating a command, **update both the alias and the full-path version** to keep them in sync.
