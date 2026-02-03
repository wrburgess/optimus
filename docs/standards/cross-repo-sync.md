# Cross-Repo Standards Synchronization

This document defines which standards are shared across all MPI Rails applications and which are project-specific, and describes how to keep them aligned.

## Shared vs Project-Specific Standards

### Shared (Universal MPI Rules)

These standards apply to **all** MPI Rails applications (optimus, avails, sfa, harvest) and should be kept consistent:

| Standard | File | What's Shared |
|----------|------|---------------|
| Agent attribution | `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` | Co-Authored-By requirement, no exceptions |
| Branch permissions | `CLAUDE.md` | Full autonomy on feature branches, ask on main |
| Commit message format | `CLAUDE.md` | Summary + detailed explanation + Co-Authored-By |
| PR description format | `CLAUDE.md` | Summary, Changes, Technical Approach, Testing, Checklist |
| Pre-commit requirements | `CLAUDE.md`, `AGENTS.md` | rubocop + rspec must pass before commit |
| Testing conventions | `docs/standards/testing.md` | FactoryBot, request specs, shared context patterns |
| Code review checklist | `docs/standards/code-review.md` | Authorization, security, database, pattern checks |
| Documentation standards | `docs/standards/documentation.md` | When/where to write docs, inline comment rules |
| Style conventions | `docs/standards/style.md` | Rubocop omakase, naming conventions |
| HC review checklist | `docs/standards/hc-review-checklist.md` | Business logic, UX, data integrity, agent concerns |
| Review severity levels | `AGENTS.md` | P0/P1/P2 definitions |
| Agent workflow | `docs/architecture/agent-workflow.md` | CC/CDX/Copilot roles and workflow steps |
| Claude Code commands | `.claude/commands/` | Workflow command templates |
| Branch protection hook | `.claude/hooks/enforce-branch-creation.sh` | Prevent writes on main/master/develop |

### Project-Specific (Varies Per Repo)

These are unique to each application and should **not** be synchronized:

| Standard | File | Why It's Project-Specific |
|----------|------|--------------------------|
| Tech stack versions | `CLAUDE.md` | Each app may run different Ruby/Rails versions |
| Architecture overview | `docs/architecture/overview.md` | Models, controllers, routes are unique per app |
| Design patterns | `docs/standards/design.md` | Admin UI patterns may differ (e.g., harvest has public-facing pages) |
| Notification system | `docs/notification_system*.md` | Not all apps use notifications |
| Permission system | `docs/system_permissions*.md` | Permission models vary by app |
| Context7 library list | `AGENTS.md` | Different apps use different gems |
| Project description | `CLAUDE.md`, `AGENTS.md` | Each app has its own purpose |
| Related projects list | `.claude/projects.json` | Same across repos but paths differ |

## Sync Process

### Optimus as the Template

Optimus is the **source of truth** for shared standards. When a shared standard changes:

1. Update the standard in Optimus first
2. Use the `/project:compare-standards` command to diff against other repos
3. Create PRs in each downstream repo to sync the changes
4. Each repo adapts project-specific sections as needed

### When to Sync

- After any change to a shared standard file in Optimus
- When a downstream repo discovers a better pattern (update Optimus first, then propagate)
- Periodically (e.g., monthly) to catch drift

### How to Sync

Use the Claude Code compare-standards command:

```
/project:compare-standards avails
```

This will:
1. Read the target repo's agent config files
2. Compare shared sections against Optimus
3. Report differences
4. Suggest specific updates for the target repo

### Manual Sync

If the command isn't available or you prefer manual sync:

1. Open Optimus and the target repo side by side
2. Compare each shared file (see table above)
3. Copy shared sections, preserving project-specific sections
4. Run tests in the target repo to verify nothing broke

## File Structure Convention

All MPI Rails apps should follow this directory structure for agent configuration:

```
project-root/
├── CLAUDE.md                              # Claude Code instructions
├── AGENTS.md                              # Universal agent instructions (Codex, etc.)
├── .claude/
│   ├── settings.json                      # Claude Code permissions and hooks
│   ├── hooks/
│   │   └── enforce-branch-creation.sh     # Branch protection
│   ├── commands/
│   │   ├── revi.md                        # Review issue
│   │   ├── explore.md                     # Explore codebase
│   │   ├── cplan.md                       # Create plan
│   │   ├── esti.md                        # Estimate agents
│   │   ├── impl.md                        # Implement
│   │   ├── rtr.md                         # Respond to review
│   │   ├── final.md                       # Finalize PR
│   │   ├── research/                      # Full-name research commands
│   │   ├── plan/                          # Full-name plan commands
│   │   └── execute/                       # Full-name execute commands
│   └── projects.json                      # MPI ecosystem project references
├── .github/
│   └── copilot-instructions.md            # GitHub Copilot instructions
└── docs/
    ├── architecture/
    │   ├── overview.md                    # Project-specific architecture
    │   └── agent-workflow.md              # Agent workflow (shared)
    ├── standards/
    │   ├── testing.md                     # Testing standards (shared)
    │   ├── code-review.md                # Code review checklist (shared)
    │   ├── documentation.md              # Documentation standards (shared)
    │   ├── design.md                     # Design standards (project-specific)
    │   ├── style.md                      # Style standards (shared)
    │   ├── hc-review-checklist.md        # HC review checklist (shared)
    │   └── cross-repo-sync.md            # This document (shared)
    └── research/                          # Research notes
```
