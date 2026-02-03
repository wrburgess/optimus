# Agent Workflow Architecture

This document describes how AI agents (Claude Code, Codex, Copilot) interact in the MPI development workflow.

## Agent Roles

| Agent | Role | Trigger |
|-------|------|---------|
| **Claude Code (CC)** | Primary development agent — analyzes issues, plans, implements, creates PRs | Human invokes via CLI commands |
| **Codex (CDX)** | Automated PR reviewer — reviews code for P0/P1/P2 issues | Automatic on PR creation, or `@codex review` comment |
| **Copilot** | Inline code assistance and suggestions | IDE integration, or PR review via GitHub settings |

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
7. Codex auto-reviews the PR
   └── Posts code review with P0/P1/P2 findings
        │
8. CC reads Codex review (/project:rtr NNN)
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
| `AGENTS.md` | Codex, all agents | Universal agent instructions, review guidelines, architecture |
| `.github/copilot-instructions.md` | GitHub Copilot | Copilot-specific instructions and patterns |
| `.claude/settings.json` | Claude Code | Permissions, hooks configuration |
| `.claude/commands/*.md` | Claude Code | Reusable workflow command templates |

## Review Severity Levels

Codex uses severity levels defined in `AGENTS.md`:

- **P0 — Must Fix**: Security vulnerabilities, missing authorization, broken tests, credentials in code, data loss risks
- **P1 — Should Fix**: N+1 queries, missing validations, pattern violations, missing tests, exposed Ransack attributes
- **P2 — Consider**: Naming, organization, performance, edge cases

By default, Codex flags P0 and P1 issues. Adjust sensitivity in the `AGENTS.md` Review Guidelines section.

## Agent Attribution

Every agent must include attribution on all work. This is enforced by `CLAUDE.md`, `AGENTS.md`, and `.github/copilot-instructions.md`:

```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
Co-Authored-By: GitHub Copilot <noreply@github.com>
Co-Authored-By: OpenAI Codex <noreply@openai.com>
```

## Codex Setup

### Prerequisites

- OpenAI account with Codex access (ChatGPT Plus, Pro, Business, Edu, or Enterprise)
- Repository accessible to Codex (GitHub integration enabled)

### Enable Codex PR Review

1. Navigate to Codex settings (via ChatGPT or OpenAI dashboard)
2. Connect the GitHub repository
3. Toggle **Code review** ON for the repository
4. Enable **Automatic reviews** to review every new PR
5. Optionally enable **Review new pushes** for re-review on force pushes

### Manual Review Trigger

Comment on any PR to trigger a Codex review:

```
@codex review
```

With specific focus:

```
@codex review for security vulnerabilities
@codex review for N+1 queries and performance
```

### GitHub Copilot Code Review (Alternative)

GitHub Copilot can also review PRs natively:

1. Go to repository Settings → Copilot → Code review
2. Enable automatic code review
3. Copilot reads `.github/copilot-instructions.md` for project-specific guidance

Both Codex and Copilot can be enabled simultaneously — they review independently.

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
