# MPI Infrastructure Guide

This document is the single source of truth for how MPI Media's shared infrastructure — repositories, agent configuration, HC workflows, CI/CD, and standards — fits together. It serves both human collaborators (HCs) and AI collaborators (ACs).

**HCs:** If you're looking for a focused guide on your role, workflow commands, and what to review, see [docs/hc-guide.md](../hc-guide.md) instead.

## Terminology

| Abbreviation | Meaning | Examples |
|---|---|---|
| **HC** | Human Collaborator — a person working on MPI projects | Developer, reviewer, product owner |
| **AC** | AI Collaborator — any AI agent working on MPI projects | Claude Code, GitHub Copilot |
| **CC** | Claude Code — the primary AC for development | Claude Code CLI (Opus, Sonnet) |
| **CDX** | GitHub Copilot — AC for automated PR review and IDE assist | Copilot code review, inline suggestions |

## Repository Map

MPI's shared infrastructure lives across four repositories (three active, one deprecated). Each has a distinct, non-overlapping purpose.

### `mpimedia/optimus` (this repo)

**Role:** Template application, source of truth for all standards and AC configuration.

Everything an AC or HC needs to work on an MPI Rails project originates here. Standards are synced from Optimus to downstream projects (avails, sfa, harvest, garden) via the process described in `docs/standards/cross-repo-sync.md`.

| What | Where | Purpose |
|------|-------|---------|
| AC instructions (Claude Code) | `CLAUDE.md` | Primary AC behavior, architecture, commands, attribution rules |
| AC instructions (Copilot) | `.github/copilot-instructions.md` | Copilot-specific patterns and review criteria |
| AC settings | `.claude/settings.json` | Shared permissions and hooks (checked in) |
| AC local settings | `.claude/settings.local.json` | Personal permissions, MCP servers (gitignored) |
| AC workflow commands | `.claude/commands/` | 11 workflow command templates (research, plan, execute, utility) |
| AC hooks | `.claude/hooks/` | Branch protection script |
| MCP server config | `.mcp.json` | Context7, GitHub, Heroku (gitignored; `.mcp.json.example` provided) |
| Project registry | `.claude/projects.json` | MPI ecosystem project list with GitHub URLs |
| Architecture docs | `docs/architecture/` | Overview, agent workflow, this document |
| Standards docs | `docs/standards/` | Testing, style, code review, hotwire, caching, query patterns |
| System guides | `docs/` | Permissions, notifications, credentials, deployment, assets |

### `mpimedia/mpi-application-workflows`

**Role:** Reusable GitHub Actions workflows shared by all MPI Rails applications.

This repository **must** remain separate — GitHub requires reusable workflows to live in a dedicated repo for the `uses: org/repo/.github/workflows/file.yml@ref` syntax to work.

| Workflow | File | Purpose | Schedule |
|----------|------|---------|----------|
| CI pipeline | `ci-rails.yml` | RSpec, RuboCop, Brakeman, bundler-audit, JS audit | Every push |
| Gem updates | `update-gems.yml` | Automated gem update PRs | Daily 06:00 CST |
| Package updates | `update-packages.yml` | Automated Node package update PRs | Daily 06:05 CST |
| Index checks | `check-indexes.yml` | Verify foreign keys have indexes | PRs touching migrations |

**CI pipeline inputs** (per-project customization):

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `elasticsearch` | boolean | `false` | Start Elasticsearch service for tests |
| `libvips` | boolean | `false` | Install libvips for image processing |
| `security_scan` | boolean | `true` | Run Brakeman + bundler-audit |
| `lint` | boolean | `true` | Run RuboCop |
| `importmap` | boolean | `true` | Run importmap audit |
| `jsbundling` | boolean | `false` | Run yarn npm audit (esbuild/webpack projects) |
| `rspec_options` | string | `''` | Additional RSpec flags |

**Version pinning:** All consuming repos pin to a specific commit SHA for stability. The current pinned SHA is documented in `CLAUDE.md` under "CI Workflows." To update:

1. Review changes in `mpi-application-workflows` since the pinned SHA
2. Update the SHA in all 4 workflow files in the consuming repo simultaneously
3. Test by running CI on a feature branch before merging

### `mpimedia/.github` (org-level)

**Role:** Organization-wide GitHub defaults that apply to all `mpimedia` repos unless overridden.

| What | Where | Purpose |
|------|-------|---------|
| PR template | `PULL_REQUEST_TEMPLATE.md` | Default PR description structure |
| Issue templates | `.github/ISSUE_TEMPLATE/` | Standard issue forms |
| Copilot instructions | `.github/copilot-instructions.md` | Org-level Copilot guidance (overridden per-repo) |
| Workflow templates | `workflow-templates/` | Starter workflows for new repos |

### `mpimedia/mpi-application-standards` (deprecated)

**Status:** Scheduled for archival. All unique content has been consolidated into Optimus.

This repo previously held shared Claude Code instructions (`CLAUDE.base.md`, `CLAUDE.rails.md`, `CLAUDE.rspec.md`) consumed as a git submodule. Optimus now contains all of this content natively in `CLAUDE.md` and `docs/standards/`. The submodule approach added complexity (submodule init, update cycles, sync drift) without clear benefit over Optimus-as-source-of-truth.

**Unique content migrated:**

| Source (mpi-application-standards) | Destination (Optimus) |
|---|---|
| `CLAUDE.base.md` — permissions, commit format, MCP config | `CLAUDE.md` |
| `CLAUDE.rails.md` — architecture, patterns, gems | `CLAUDE.md` |
| `CLAUDE.rspec.md` — testing standards, spec templates | `docs/standards/testing.md` |
| `claude/skills/write-spec.md` — spec generation skill | `.claude/commands/` (if adopted) |
| `claude/hooks/enforce-branch-creation.sh` | `.claude/hooks/enforce-branch-creation.sh` |
| `mcp-servers/honeybadger/` — Honeybadger MCP server | Evaluate for `.mcp.json.example` inclusion |
| `docs/TEAM_ONBOARDING.md` — submodule setup guide | Superseded by this document |

## Application Ecosystem

| Project | Repo | Role | Tech |
|---------|------|------|------|
| **Optimus** | `mpimedia/optimus` | Template and standards source | Rails, PostgreSQL, Hotwire |
| **Avails** | `mpimedia/avails` | Central data repository | Rails, PostgreSQL, Elasticsearch |
| **SFA** | `mpimedia/wpa_film_library` | Video clip hosting and search | Rails, PostgreSQL, Elasticsearch |
| **Garden** | `mpimedia/garden` | Static site generator | Rails, PostgreSQL |
| **Harvest** | `mpimedia/harvest` | Ecommerce platform | Rails, PostgreSQL |

All Rails applications follow the same directory structure for AC configuration, documented in `docs/standards/cross-repo-sync.md`.

---

## AC Configuration

This section explains how all the AC configuration files work together.

### Configuration Cascade

AC behavior is determined by a layered set of configuration files. Higher layers override or extend lower ones:

```
1. Org-level (.github repo)
   └── .github/copilot-instructions.md     — Org-wide Copilot defaults

2. Project-level (each app repo)
   ├── CLAUDE.md                            — Claude Code primary instructions
   ├── .github/copilot-instructions.md      — Project-specific Copilot overrides
   ├── .claude/settings.json                — Shared AC permissions + hooks
   ├── .claude/settings.local.json          — Personal AC permissions (gitignored)
   ├── .claude/commands/*.md                — Workflow skill templates
   ├── .claude/hooks/                       — Pre-tool-use hook scripts
   ├── .claude/projects.json                — Ecosystem project registry
   └── .mcp.json                            — MCP server connections (gitignored)

3. Session-level
   └── User prompts and slash commands      — Per-session AC direction
```

### CLAUDE.md

The primary instruction file for Claude Code. Contains:

- **About** — Project description and role in the ecosystem
- **Tech Stack** — Language/framework versions
- **Commands** — Development, test, lint, deploy commands
- **Required Workflow** — Pre-commit checks (rubocop, rspec, brakeman, bundler-audit)
- **Permissions** — Branch-based autonomy model
- **Commit/PR Standards** — Message format, verbose documentation requirements
- **Agent Attribution** — Co-Authored-By requirements (non-negotiable)
- **Agent Strategy** — Single vs parallel vs background agent guidance
- **Architecture** — Authorization, controllers, ViewComponents, frontend, patterns
- **Testing** — RSpec conventions, shared contexts, coverage requirements
- **Key Gems** — Critical dependencies and their roles

### .claude/settings.json vs .claude/settings.local.json

| File | Checked In | Contains |
|------|-----------|----------|
| `settings.json` | Yes | Team-agreed permissions (gh CLI), hooks (branch protection) |
| `settings.local.json` | No (gitignored) | Personal permissions, MCP server enablement, tool overrides |

The shared `settings.json` applies automatically. Create `settings.local.json` for your personal workflow.

### .claude/commands/ (Skills)

11 workflow command templates organized into three phases:

**Research Phase:**

| Command | Alias | Purpose |
|---------|-------|---------|
| `research/review-issue.md` | `revi` | Analyze issue, post assessment + options |
| `research/explore-codebase.md` | `explore` | Deep-dive into a codebase area |
| `research/compare-standards.md` | `compare` | Diff standards against another MPI repo |

**Plan Phase:**

| Command | Alias | Purpose |
|---------|-------|---------|
| `plan/create-plan.md` | `cplan` | Create implementation plan from chosen option |
| `plan/estimate-agents.md` | `esti` | Determine single vs parallel agent strategy |
| `plan/orchestrate.md` | `orch` | Design multi-agent work streams |

**Execute Phase:**

| Command | Alias | Purpose |
|---------|-------|---------|
| `execute/implement.md` | `impl` | Execute plan, create branch, write code, open PR |
| `execute/respond-to-review.md` | `rtr` | Read and address PR review comments |
| `execute/finalize-pr.md` | `final` | Rebase, verify CI, post SOW, prepare for merge |

**Utility Commands:**

| Command | Purpose |
|---------|---------|
| `dep-review.md` | Review Dependabot/dependency update PRs |
| `db-health.md` | Run database health diagnostics |

Aliases are identical copies of their full-path versions. Both forms are interchangeable. When updating a command, update both the alias and full-path version.

### MCP Servers

MCP (Model Context Protocol) servers give ACs access to external tools and data. Configuration lives in `.mcp.json` (gitignored). A `.mcp.json.example` template is provided.

| Server | Purpose | How to Get Key |
|--------|---------|----------------|
| **Context7** | Up-to-date library docs and code examples | [context7.com](https://context7.com) |
| **GitHub** | Structured GitHub API (issues, PRs, reviews) | `gh auth token` |
| **Heroku** | App management, logs, database, scaling | `heroku auth:token` |

### Hooks

The `enforce-branch-creation.sh` hook runs before any Write/Edit tool use. It prevents ACs from making changes on protected branches (`main`, `master`, `develop`), forcing work onto feature branches.

Configured in `.claude/settings.json` under `hooks.PreToolUse`.

---

## HC Workflows

### Standard Development Flow

```
1. HC creates GitHub Issue
       |
2. AC analyzes issue (/revi NNN)
   +-- Asks clarifying questions
   +-- Posts assessment + options on Issue
       |
3. HC chooses option
       |
4. AC creates plan (/cplan NNN)
   +-- Posts plan on Issue
       |
5. HC approves plan
       |
6. AC implements (/impl NNN)
   +-- Creates branch
   +-- Writes code + tests
   +-- Runs rubocop + rspec + brakeman + bundler-audit
   +-- Creates PR with implementation notes
       |
7. Copilot auto-reviews the PR
   +-- Posts review with P0/P1/P2 findings
       |
8. AC addresses review (/rtr NNN)
   +-- Categorizes comments, proposes resolutions
   +-- HC chooses which to address
       |
9. AC makes changes, pushes, replies to comments
       |
10. HC reviews PR
        |
11. AC finalizes (/final NNN)
    +-- Rebases, verifies CI
    +-- Posts SOW on PR
        |
12. HC merges PR --> Issue closed
```

### Branch-Based Permissions

| Branch | AC Behavior |
|--------|-------------|
| Feature branch (anything except `main`) | Full autonomy — commit, edit, refactor, fix without asking |
| `main` | Ask before any change, require explicit HC approval |

ACs check the branch before starting work with `git branch --show-current`.

### Review Severity Levels

| Level | Meaning | Examples |
|-------|---------|---------|
| **P0 — Must Fix** | Security, correctness, data integrity | Missing authorization, exposed credentials, broken tests |
| **P1 — Should Fix** | Performance, patterns, coverage | N+1 queries, missing validations, pattern violations |
| **P2 — Consider** | Style, naming, edge cases | Naming improvements, optional optimizations |

### What HCs Review That ACs Miss

See `docs/standards/hc-review-checklist.md` for the full checklist. Key areas:

- Business logic correctness and domain context
- UX coherence across the application
- Data integrity and migration safety
- Performance implications at production scale
- Whether the AC followed the agreed plan

### Pre-Commit Requirements

Every AC and HC must pass these four checks before committing:

```bash
bundle exec rubocop -a       # Lint and auto-correct
bundle exec rspec             # Full test suite
bin/brakeman --no-pager -q    # Security static analysis
bin/bundler-audit check       # Vulnerable dependency check
```

No exceptions. CI runs the same checks.

### Agent Attribution

Non-negotiable on every piece of AC work:

| Context | Attribution |
|---------|------------|
| Commits | `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>` |
| PRs | Agent name in description footer |
| Issue comments | Brief attribution line (e.g., `— Claude Code (Opus 4.5)`) |
| PR review comments | Attribution in each comment or summary |

If multiple ACs contribute to the same commit, include a `Co-Authored-By` line for each.

---

## CI/CD

### How Shared Workflows Work

Each MPI Rails application has thin workflow files in `.github/workflows/` that delegate to reusable workflows in `mpimedia/mpi-application-workflows`:

```yaml
# .github/workflows/ci.yml (in each app repo)
jobs:
  ci:
    uses: mpimedia/mpi-application-workflows/.github/workflows/ci-rails.yml@<SHA>
    with:
      jsbundling: true    # per-project customization
    secrets: inherit
```

The `@<SHA>` pin ensures stability. All four workflow files in a repo must use the same SHA.

### CI Pipeline Steps

The `ci-rails.yml` workflow runs:

1. **Security scan** — Brakeman (static analysis) + bundler-audit (vulnerable gems) + JS audit
2. **Lint** — RuboCop with rubocop-rails-omakase and plugins
3. **Test** — RSpec with PostgreSQL, optional Elasticsearch
4. **Index check** — Verify foreign keys have database indexes (on migration changes)

### Automated Dependency Updates

Two workflows create daily PRs for dependency updates:

- **Gem updates** (`update-gems.yml`) — Runs `bundle update`, opens PR at 06:00 CST
- **Package updates** (`update-packages.yml`) — Runs yarn upgrade, opens PR at 06:05 CST

Use the `/dep-review NNN` command to review these PRs.

### Updating the Shared Workflow SHA

1. Check what changed in `mpi-application-workflows` since the current pinned SHA
2. Update the SHA in all 4 workflow files in the consuming repo **simultaneously**
3. Push to a feature branch and verify CI passes
4. Merge

---

## Required Quality Tooling

Every MPI Rails application must include the following gems and configuration. These are non-negotiable — they form the quality gates that CI enforces and that ACs/HCs must pass before committing.

### Security Scanning

| Gem | Group | Purpose | CI Integration |
|-----|-------|---------|----------------|
| `brakeman` | `:development` | Static analysis for security vulnerabilities (SQL injection, XSS, etc.) | Runs via `ci-rails.yml` when `security_scan: true` (default) |
| `bundler-audit` | `:development` | Checks for known vulnerabilities in gem dependencies | Runs via `ci-rails.yml` when `security_scan: true` (default) |

**Required binstubs:** `bin/brakeman`, `bin/bundler-audit`

**bundler-audit configuration** (`config/bundler-audit.yml`):

```yaml
# CVEs that are not relevant to this application can be safelisted here.
# Each entry should include a comment explaining why it's safe to ignore.
ignore:
  - CVE-THAT-DOES-NOT-APPLY
```

Use this file to suppress known CVEs that don't apply to your application (e.g., a vulnerability in a feature you don't use). Always document why a CVE is ignored.

**CI requirement:** `security_scan` must be `true` (the default) in the CI workflow. Never set `security_scan: false` without a tracking issue and timeline to re-enable.

### Linting

| Gem | Group | Purpose |
|-----|-------|---------|
| `rubocop` | `:development, :test` | Ruby linter and formatter |
| `rubocop-rails-omakase` | `:development, :test` | Opinionated Rails baseline (replaces manual rubocop-rails config) |
| `rubocop-rspec` | `:development, :test` | RSpec-specific cops |
| `rubocop-capybara` | `:development, :test` | Capybara-specific cops |
| `rubocop-factory_bot` | `:development, :test` | FactoryBot-specific cops |

**`.rubocop.yml` must** inherit from `rubocop-rails-omakase`, require all plugins, and exclude non-application directories:

```yaml
# Omakase Ruby styling for Rails
inherit_gem: { rubocop-rails-omakase: rubocop.yml }

require:
  - rubocop-rspec
  - rubocop-capybara
  - rubocop-factory_bot

AllCops:
  Exclude:
    - '.git/**/*'
    - '.vscode/**/*'
    - '.yarn/**/*'
    - 'config/routes.rb'
    - 'db/**/*'
    - 'node_modules/**/*'
    - 'sql/**/*'
    - 'tmp/**/*'
    - 'vendor/**/*'
```

The `AllCops.Exclude` list prevents RuboCop from scanning generated files, vendored code, and database files that don't follow application conventions.

### Test Coverage

| Gem | Group | Purpose |
|-----|-------|---------|
| `simplecov` | `:test` | Test coverage measurement and enforcement |

**Configuration requirements:**
- Minimum coverage target: **90%** (ratchet up from current baseline)
- `refuse_coverage_drop` prevents coverage from regressing
- Must be required at the top of `spec/spec_helper.rb` (before any other requires):

```ruby
require "simplecov"

SimpleCov.start "rails" do
  enable_coverage :branch

  add_filter "/spec/"
  add_filter "/config/"
  add_filter "/db/"
  add_filter "/vendor/"

  add_group "Models", "app/models"
  add_group "Controllers", "app/controllers"
  add_group "Jobs", "app/jobs"
  add_group "Policies", "app/policies"
  add_group "Components", "app/components"
  add_group "Modules", "app/modules"
  add_group "Services", "app/services"
  add_group "Helpers", "app/helpers"
  add_group "Mailers", "app/mailers"
  add_group "Tasks", "app/tasks"

  # Set to current baseline; raise as coverage improves toward 90%
  minimum_coverage 66
  refuse_coverage_drop
end
```

### N+1 Query Detection

| Gem | Group | Purpose |
|-----|-------|---------|
| `bullet` | `:development, :test` | Detects N+1 queries, unused eager loading, and missing counter caches |

**Must be in both `:development` and `:test` groups.** Development-only means N+1 queries won't be caught in CI.

**Configuration required** in `config/environments/development.rb`:

```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.alert = true
  Bullet.bullet_logger = true
  Bullet.console = true
  Bullet.rails_logger = true
  Bullet.add_footer = true
end
```

And in `config/environments/test.rb`:

```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.raise = true

  # Safelist false positives — e.g., has_many :through intermediate joins
  # that Bullet flags as unused eager loading but are actually required.
  Bullet.add_safelist type: :unused_eager_loading,
                      class_name: "SystemRole",
                      association: :system_role_system_permissions
end
```

Setting `Bullet.raise = true` causes tests to fail on N+1 queries, ensuring CI catches them. Use `Bullet.add_safelist` for verified false positives with an explanatory comment.

### Migration Safety

| Gem | Group | Purpose |
|-----|-------|---------|
| `strong_migrations` | default (all environments) | Blocks unsafe migration operations before they reach production |

Catches: adding columns with defaults on large tables, removing columns without `safety_assured`, renaming tables, changing column types, and other destructive operations. Follow the suggested safe alternative in error messages. Use `safety_assured { }` only when verified safe for production data.

**Configuration** in `config/initializers/strong_migrations.rb`:

```ruby
# Set to the timestamp of the latest existing migration at the time
# strong_migrations was added. Only migrations after this timestamp are checked.
StrongMigrations.start_after = 20260119170658

# Target the PostgreSQL version used in production
StrongMigrations.target_postgresql_version = "17"

# Explicitly enable safety checks for these operations:
StrongMigrations.enabled_checks = [
  :add_column_default, :add_index, :add_reference, :change_column,
  :change_column_default, :change_column_null, :create_table, :execute,
  :remove_column, :remove_index, :rename_column, :rename_table
]
```

When adding strong_migrations to a new project, set `start_after` to the timestamp of the latest existing migration so it only checks new ones.

### Testing Framework

| Gem | Group | Purpose |
|-----|-------|---------|
| `rspec-rails` | `:development, :test` | Test framework |
| `factory_bot_rails` | `:development, :test` | Test data factories (not fixtures) |
| `shoulda-matchers` | `:test` | One-liner model/association/validation tests |
| `pundit-matchers` | `:test` | Policy spec assertions (for Pundit-based apps) |
| `capybara` | `:test` | Feature/integration test DSL |
| `selenium-webdriver` | `:test` | Browser driver for feature specs |

### Pre-Commit Check Summary

Every commit must pass all four gates. This applies to both ACs and HCs:

```bash
bundle exec rubocop -a       # Lint (rubocop-rails-omakase + plugins)
bundle exec rspec             # Tests (SimpleCov enforces coverage)
bin/brakeman --no-pager -q    # Security static analysis
bin/bundler-audit check       # Vulnerable dependency check
```

CI runs the same checks via the shared `ci-rails.yml` workflow. If it passes locally, it passes in CI.

### Gemfile Group Requirements

Gems must be in the correct Bundler groups to ensure they're available in all needed environments:

| Group | When Available | Gems |
|-------|---------------|------|
| default (no group) | All environments | `strong_migrations` |
| `:development` | Dev only | `brakeman`, `bundler-audit` |
| `:development, :test` | Dev + test + CI | `rubocop` stack, `rspec-rails`, `factory_bot_rails`, `bullet` |
| `:test` | Test + CI only | `simplecov`, `shoulda-matchers`, `pundit-matchers`, `capybara`, `selenium-webdriver` |

**Common mistake:** Putting linting/testing gems in `:development` only. CI typically runs in the test environment, so gems in `:development` only may not be available in CI unless the workflow explicitly installs development dependencies.

---

## Standards Sync

### Shared vs Project-Specific

Standards fall into two categories. See `docs/standards/cross-repo-sync.md` for the full matrix.

**Shared (universal MPI rules)** — Must be consistent across all apps:
- Quality tooling: required gems, Gemfile groups, configuration (see "Required Quality Tooling" above)
- CI/CD: shared workflows, SHA pinning, `security_scan: true`
- Agent attribution, branch permissions, commit/PR format
- Testing conventions, code review checklist, style conventions
- Hotwire patterns, caching standards, query patterns
- HC review checklist, agent workflow, Claude Code commands

**Project-specific** — Varies per app:
- Tech stack versions, architecture overview, design patterns
- Notification system, permission system, project description

### Sync Process

Optimus is the source of truth. When a shared standard changes:

1. Update the standard in Optimus first
2. Use `/compare <repo>` to diff against downstream repos
3. Create PRs in downstream repos to sync changes
4. Each repo adapts project-specific sections as needed

### When to Sync

- After any change to a shared standard file in Optimus
- When a downstream repo discovers a better pattern (update Optimus first, then propagate)
- Periodically to catch drift

---

## Setting Up a New MPI Project

### 1. Create the repository

Use Optimus as the reference for directory structure and configuration patterns.

### 2. Copy AC configuration from Optimus

```
CLAUDE.md                              # Adapt project-specific sections
.claude/settings.json                  # Copy as-is
.claude/hooks/enforce-branch-creation.sh  # Copy as-is
.claude/commands/                      # Copy all command templates
.claude/projects.json                  # Copy as-is
.github/copilot-instructions.md        # Adapt project-specific sections
.mcp.json.example                      # Copy as-is
```

### 3. Install required quality gems

Add all gems from the "Required Quality Tooling" section to the Gemfile in the correct groups. Then configure:

- SimpleCov at the top of `spec/spec_helper.rb` (90% ratchet target)
- Bullet in `config/environments/development.rb` and `config/environments/test.rb`
- strong_migrations (install: `rails generate strong_migrations:install`)
- `.rubocop.yml` inheriting from `rubocop-rails-omakase` with all plugins
- Binstubs: `bin/brakeman`, `bin/bundler-audit`

### 4. Set up CI workflows

Create thin workflow files that delegate to `mpi-application-workflows`:

```
.github/workflows/ci.yml
.github/workflows/update-gems.yml
.github/workflows/update-packages.yml
.github/workflows/check_indexes.yml
```

Use the examples from the `mpi-application-workflows` README, pinning to the current SHA.

### 5. Copy shared standards docs

```
docs/architecture/agent-workflow.md
docs/standards/testing.md
docs/standards/code-review.md
docs/standards/style.md
docs/standards/hotwire-patterns.md
docs/standards/caching.md
docs/standards/query-patterns.md
docs/standards/hc-review-checklist.md
docs/standards/cross-repo-sync.md
docs/standards/documentation.md
```

### 6. Create project-specific docs

```
docs/architecture/overview.md          # Unique to this project
docs/standards/design.md               # Unique to this project
```

### 7. Personal setup (each HC/AC operator)

```bash
# Create personal settings
cp .claude/settings.local.json.example .claude/settings.local.json  # if provided

# Create MCP config
cp .mcp.json.example .mcp.json
# Fill in API keys for Context7, GitHub, Heroku

# Install Claude Code plugins
claude plugin marketplace add boostvolt/claude-code-lsps
claude plugin install solargraph@claude-code-lsps

# Enable LSP
export ENABLE_LSP_TOOL=1  # Add to ~/.zshrc or ~/.bashrc
```

---

## Development Environment

### Version Management (`.tool-versions`)

All MPI projects use [asdf](https://asdf-vm.com/) (or compatible tools like [mise](https://mise.jdx.dev/)) for runtime version management. The `.tool-versions` file in the repo root pins exact versions:

```
ruby     4.0.1
nodejs   25.5.0
postgres 17.6
yarn     4.12.0
```

These must match the versions in `CLAUDE.md` and the CI environment. When upgrading a runtime, update `.tool-versions`, `CLAUDE.md`, and verify CI compatibility.

### Development Server

`bin/dev` starts the full development stack via `foreman` using `Procfile.development`:

```
web:    bin/rails server -p 8000
js:     yarn build --watch
css:    yarn build:css --watch
worker: bundle exec good_job start
```

Split Procfiles are available for partial startup:

| Procfile | Processes | Use Case |
|----------|-----------|----------|
| `Procfile.development` | web, js, css, worker | Full stack (`bin/dev`) |
| `Procfile.dev.backend` | worker | Background jobs only |
| `Procfile.dev.frontend` | js, css | Asset compilation only |

### Bin Scripts

All MPI Rails apps should include these binstubs in `bin/`:

| Script | Purpose | Required? |
|--------|---------|-----------|
| `bin/rails` | Rails CLI | Yes (Rails default) |
| `bin/rake` | Rake tasks | Yes (Rails default) |
| `bin/dev` | Start development server via foreman | Yes |
| `bin/setup` | Initial project setup (bundle, db:prepare, assets, clear) | Yes |
| `bin/ci` | Run full CI check suite locally | Recommended |
| `bin/rubocop` | RuboCop linter | Yes |
| `bin/brakeman` | Security static analysis | Yes |
| `bin/bundler-audit` | Vulnerable dependency check | Yes |
| `bin/jobs` | Start GoodJob worker | Recommended |
| `bin/kamal` | Kamal deployment CLI | If using Kamal |
| `bin/thrust` | Kamal Thruster (HTTP/2 proxy) | If using Kamal |
| `bin/docker-entrypoint` | Docker container entrypoint | If using Docker |
| `bin/importmap` | Importmap CLI (if not using esbuild) | Project-specific |
| `bin/update-gems` | Automated gem updates (used by CI workflow) | Recommended |
| `bin/update-packages` | Automated package updates (used by CI workflow) | Recommended |

The critical binstubs for the pre-commit workflow are `bin/rubocop`, `bin/brakeman`, and `bin/bundler-audit`.

---

## Quick Reference

### File Map

```
project-root/
+-- CLAUDE.md                              # CC primary instructions
+-- .claude/
|   +-- settings.json                      # Shared AC permissions + hooks
|   +-- settings.local.json                # Personal AC settings (gitignored)
|   +-- hooks/
|   |   +-- enforce-branch-creation.sh     # Branch protection
|   +-- commands/
|   |   +-- revi.md                        # Aliases (top-level)
|   |   +-- explore.md
|   |   +-- compare.md
|   |   +-- cplan.md
|   |   +-- esti.md
|   |   +-- orch.md
|   |   +-- impl.md
|   |   +-- rtr.md
|   |   +-- final.md
|   |   +-- dep-review.md
|   |   +-- db-health.md
|   |   +-- research/                      # Full-path commands
|   |   +-- plan/
|   |   +-- execute/
|   +-- projects.json                      # MPI ecosystem registry
+-- .github/
|   +-- copilot-instructions.md            # CDX instructions
|   +-- workflows/
|       +-- ci.yml                         # -> ci-rails.yml
|       +-- update-gems.yml               # -> update-gems.yml
|       +-- update-packages.yml           # -> update-packages.yml
|       +-- check_indexes.yml             # -> check-indexes.yml
+-- .mcp.json                              # MCP server config (gitignored)
+-- .mcp.json.example                      # MCP template
+-- docs/
    +-- architecture/
    |   +-- overview.md                    # Project architecture
    |   +-- agent-workflow.md              # AC workflow + multi-agent patterns
    |   +-- mpi-infrastructure.md          # This document
    +-- standards/
        +-- testing.md                     # RSpec conventions
        +-- code-review.md                # Review checklist
        +-- style.md                      # Rubocop, naming
        +-- design.md                     # UI/UX patterns
        +-- hotwire-patterns.md           # Turbo, Stimulus
        +-- caching.md                    # Fragment caching, SolidCache
        +-- query-patterns.md             # Eager loading, optimization
        +-- hc-review-checklist.md        # HC-specific review items
        +-- cross-repo-sync.md            # Shared vs project-specific standards
        +-- documentation.md              # Documentation standards
```

### Command Cheat Sheet

```bash
# Development
/revi NNN                    # Review issue, post assessment
/cplan NNN                   # Create implementation plan
/esti NNN                    # Estimate agent strategy
/orch NNN                    # Orchestrate parallel agents
/impl NNN                    # Implement plan, create PR
/rtr NNN                     # Respond to PR review
/final NNN                   # Finalize PR for merge
/dep-review NNN              # Review dependency update PR
/db-health                   # Database health check
/explore TOPIC               # Explore codebase area
/compare REPO                # Compare standards with another repo
```
