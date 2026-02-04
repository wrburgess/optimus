# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

Optimus is the Ruby on Rails application template and reference implementation for the MPI Media application ecosystem. It defines the coding standards, architectural patterns, and development workflows used across all MPI projects.

For detailed architecture documentation, see `docs/architecture/overview.md`.

## Tech Stack

- Ruby 4.0.1 / Rails 8.1.2
- PostgreSQL 17.6
- Hotwire (Turbo + Stimulus)
- Bootstrap 5.3
- ViewComponent
- Node 25.4.0 / Yarn 4.12.0
- esbuild (JS) / Sass (CSS)

## Commands

```bash
# Development server (runs web, js, css, worker)
bin/dev

# Tests
bundle exec rspec                              # All tests
bundle exec rspec spec/models/                  # Directory
bundle exec rspec spec/models/user_spec.rb      # Single file
bundle exec rspec spec/models/user_spec.rb:42   # Single line

# Linting
bundle exec rubocop        # Check all files
bundle exec rubocop -a     # Auto-correct

# Security
bin/brakeman               # Static analysis security scanner
bin/bundler-audit           # Vulnerable dependency check

# Assets
yarn build                  # JS (esbuild)
yarn build:css              # CSS (sass)

# Background jobs
bundle exec good_job start

# Credentials
bin/rails credentials:edit --environment development

# Deployment
bin/kamal deploy
```

## Required Workflow

**ALWAYS run linting, tests, and security checks before committing or pushing.**

```bash
bundle exec rubocop -a
bundle exec rspec
bin/brakeman --no-pager -q
bin/bundler-audit check
```

All four must pass before any `git commit` or `git push`. No exceptions.

### Test Coverage

SimpleCov enforces coverage with a ratchet-up approach — coverage cannot drop below the current baseline (target: 90%). Coverage drops from previous runs are refused. Run `bundle exec rspec` and check the `coverage/index.html` report if coverage is below threshold.

### Migration Safety

`strong_migrations` blocks unsafe migration operations (adding columns with defaults on large tables, removing columns without `safety_assured`, renaming tables, etc.). If a migration is flagged, follow the suggested safe alternative in the error message. Use `safety_assured { }` only when you've verified the operation is safe for production data.

## Permissions and Autonomy

### Branch-Based Permissions

**On feature branches (any branch except `main`):**
- **FULL AUTONOMY GRANTED** — Proceed with all changes without asking "should I proceed" or similar permission questions
- Make commits, edit files, refactor code, and implement features directly
- Run tests and linting, fix issues, and commit fixes automatically
- Only ask questions for **requirement clarification** (what to build, not whether to proceed)

**On `main` branch:**
- Ask before making any changes
- Require explicit user approval for commits

Check the branch before starting work:
```bash
git branch --show-current
```

## Commit and PR Standards

**All commits and PRs must have verbose, detailed documentation.**

### Commit Message Format

```
Brief summary (50 chars or less)

Detailed explanation of changes:
- What was changed and why
- Technical approach taken
- Any architectural decisions made
- Edge cases handled
- Related files or systems affected

Context for future contributors:
- Why this approach was chosen over alternatives
- Potential gotchas or areas to watch
- Related issues, tickets, or discussions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### PR Description Format

```markdown
## Summary
Detailed overview of what this PR accomplishes and why it was needed.

## Changes Made
- Bullet point list of specific changes
- Include file paths and key modifications
- Explain technical decisions

## Technical Approach
- Design patterns used
- Why this approach was chosen
- Alternatives considered and why they were rejected

## Testing
- What was tested and how
- Edge cases covered

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Changes are documented in code comments where non-obvious
```

## Agent Attribution (Required — No Exceptions)

Every AI agent (Claude, Copilot, Codex, or any other) **must** include attribution on every piece of work it produces. This is non-negotiable.

- **Commits** — Include `Co-Authored-By` trailer with the agent's name and model:
  ```
  Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
  Co-Authored-By: GitHub Copilot <noreply@github.com>
  Co-Authored-By: OpenAI Codex <noreply@openai.com>
  ```
- **Pull Requests** — Include the agent's name in the PR description footer (e.g., `Generated with [Claude Code](https://claude.com/claude-code)`)
- **Issue Comments** — Include a brief attribution line (e.g., `— Claude Code (Opus 4.5)`)
- **PR Review Comments** — Include attribution in each review comment or summary
- **Code Comments** — When an agent adds non-trivial inline comments, no attribution needed in the comment itself (the commit attribution covers it)

If multiple agents contribute to the same commit, include a `Co-Authored-By` line for each.

## Agent Strategy

When planning implementation, evaluate the optimal agent approach:

- **Single agent** — Default for most work. One agent, one branch, sequential tasks. Use when scope is < 15 files or tasks are tightly coupled.
- **Parallel agents** — Use when tasks are independent across subsystems (e.g., models vs controllers vs frontend). Each agent gets its own worktree with exclusive file ownership. No two agents modify the same file.
- **Background agents** — Use for long-running tasks (full test suite, linting large changeset) while the main agent continues other work.

For parallel work, use `/project:orch NNN` to generate an orchestration plan that defines work streams, file ownership, shared interfaces, and integration order. See `docs/architecture/agent-workflow.md` for detailed multi-agent patterns.

### Worktree Usage

- **Simple branch** (`git checkout -b`) — Single agent, single focus
- **Worktree** (`git worktree add`) — Isolation for parallel work or hotfixes alongside feature branches
- **Worktrunk** (`wt create`) — Preferred for multi-agent parallel work with shared hooks and config

## Architecture

### Authorization System

Uses Pundit with a custom permission hierarchy:

```
User → SystemGroups → SystemRoles → SystemPermissions
```

- Permissions store `resource` and `operation` (e.g., resource: "User", operation: "index")
- Checked via `user.access_authorized?(resource:, operation:)`
- `AdminApplicationPolicy` is the base policy for admin controllers
- Standard operations defined in `app/modules/system_operations.rb`
- Permissions are cached per-request in a Set to avoid N+1 queries

### Controller Hierarchy

- `ApplicationController` — Base with Pundit integration
- `AdminController` — Authenticated admin actions with `layout "admin"`, Pagy pagination, shared archive/unarchive/destroy actions
- `ApiController` — JSON API endpoints under `/api/v1/` with JWT authentication

### ViewComponents

Located in `app/components/` with directory-per-component structure:

```
app/components/admin/table_for_index/
  ├── component.rb           # Ruby logic (inherits ApplicationComponent)
  └── component.html.erb     # ERB template
```

`ApplicationComponent` includes routes, Devise helpers, Pundit, and ApplicationHelper. Previews via Lookbook at `/admin/lookbook` (dev/staging only).

### Frontend

- Two asset bundles: `admin.scss`/`admin.js` and `public.scss`/`public.js`
- Stimulus controllers in `app/javascript/admin/controllers/` and `app/javascript/public/controllers/`

### Admin Form Patterns

**Select inputs must use tom-select:**

```erb
<%= f.input :category_id,
    as: :tom_select,
    collection: Category.options_for_select,
    label: 'Category',
    prompt: 'Select a category...',
    autocomplete: 'off',
    wrapper: :tom_select_label_inset %>
```

For multi-select, add `multiple: true`. For other inputs use `wrapper: :floating_label_form`. See `app/views/admin/system_groups/_form.html.erb` for reference.

### Enumerable Pattern

For status values, type options, and categories:

1. Define constants as a module in `app/modules/` with `.all` and `.options_for_select` class methods
2. Create a concern in `app/models/concerns/` that references the module
3. Models include the concern, not the module directly
4. Tests for modules in `spec/modules/`

See `app/modules/notification_distribution_methods.rb` and `app/models/concerns/has_distribution_method.rb` for reference.

### Model Concerns

- `Archivable` — Soft delete via `archived_at` timestamp (scopes: `actives`, `archives`)
- `Loggable` — Audit logging to `data_logs` table via async `CreateDataLogJob`
- `Notifiable` — Trigger notifications via Topic/Subscriber pattern

### Notification System

Trigger notifications with:
```ruby
@instance.notify_topic("resource.action", context: { model: @instance, actor: current_user })
```

Components: `NotificationTopic`, `NotificationTemplate`, `NotificationSubscription`, `NotificationMessage`, `NotificationQueueItem`. Delivery frequencies: immediate, summarized_hourly, summarized_daily.

See `docs/notification_system.md` and `docs/notification_system_agent_guide.md` for details.

### Background Jobs (GoodJob)

- `NotifyTopicJob` — Entry point for notification processing
- `ProcessImmediateNotificationsJob` — Batch send immediate notifications
- `ProcessSummarizedNotificationsJob` — Batch send hourly/daily digests
- `DistributeNotificationJob` — Deliver single notification (row-level lock)
- `CreateDataLogJob` — Async audit log creation

### Mounted Engines (Admin)

- `/admin/blazer` — SQL queries
- `/admin/good_job` — Job dashboard
- `/admin/maintenance_tasks` — Maintenance tasks
- `/admin/pghero` — Database performance
- `/admin/lookbook` — Component preview (dev/staging only)

## Testing

- RSpec with FactoryBot (not fixtures)
- Use request specs for controllers (not controller specs)
- Shared contexts in `spec/support/shared_contexts/`:
  - `controller_setup` — User with full permissions for controller specs
  - `policy_setup` — User with full permissions for policy specs
- `login_user` macro available for authentication in specs
- Bullet detects N+1 queries in development (alerts) and test (logs warnings)
- Rubocop uses **rubocop-rails-omakase** with `rubocop-rspec`, `rubocop-capybara`, `rubocop-factory_bot` plugins

## Key Gems

- **Devise** — Authentication
- **Pundit** — Authorization policies
- **GoodJob** — Async job processing (Postgres-backed)
- **Ransack** — Search/filtering on index pages
- **Pagy** — Pagination
- **maintenance_tasks** — Data maintenance scripts
- **caxlsx_rails** — Excel exports
- **Bullet** — N+1 query detection (development alerts, test logging)
- **SimpleCov** — Test coverage enforcement (90% target, ratchet-up)
- **strong_migrations** — Migration safety checks

## Documentation

The `docs/` directory contains detailed guides:

**Standards:**
- `docs/standards/testing.md` — Testing standards, spec structure, factory conventions
- `docs/standards/code-review.md` — Code review checklist for all reviewers (HC, CC, CDX)
- `docs/standards/documentation.md` — When and where to write docs
- `docs/standards/design.md` — UI/UX patterns, component conventions, Hotwire usage
- `docs/standards/style.md` — Ruby, CSS, JS, ERB style and naming conventions
- `docs/standards/hotwire-patterns.md` — Turbo Frames, Turbo Streams, Stimulus patterns, anti-patterns
- `docs/standards/caching.md` — Fragment caching, Russian doll caching, SolidCache, invalidation
- `docs/standards/query-patterns.md` — ActiveRecord query optimization, eager loading, batch processing
- `docs/standards/hc-review-checklist.md` — What human reviewers should check that agents miss
- `docs/standards/cross-repo-sync.md` — Shared vs project-specific standards, sync process

**Architecture:**
- `docs/architecture/overview.md` — Full architecture overview
- `docs/architecture/agent-workflow.md` — Agent roles, workflow, Codex/Copilot setup

**System Guides:**
- `docs/system_permissions.md` — Authorization system
- `docs/system_permissions_agent_guide.md` — Agent guide for permissions
- `docs/notification_system.md` — Notification system
- `docs/notification_system_agent_guide.md` — Agent guide for notifications
- `docs/notification_system_implementation_kit.md` — Notification implementation kit
- `docs/credentials_management.md` — Managing Rails credentials
- `docs/dependency_management.md` — Dependency updates
- `docs/asset_pipeline.md` — Frontend asset management
- `docs/deployment.md` — Kamal deployment configuration and procedures (in planning)

## Related Projects

See `.claude/projects.json` for the MPI Media ecosystem:
- **optimus** (this repo) — Rails application template and pattern source
- **avails** — Central data repository for MPI Media
- **sfa** — Video clip hosting and search engine
- **garden** — Static site generator for MPI sites
- **harvest** — Public-facing transaction and ecommerce platform

Create `.claude/projects.local.json` (gitignored) with local paths for cross-repo operations.

## MCP Configuration

After cloning, create `.mcp.json` (gitignored) in the project root:

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_CONTEXT7_API_KEY"
      }
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_GITHUB_TOKEN"
      }
    },
    "heroku": {
      "command": "npx",
      "args": ["-y", "@heroku/mcp-server"],
      "env": {
        "HEROKU_API_KEY": "YOUR_HEROKU_API_KEY"
      }
    }
  }
}
```

- **Context7** — Up-to-date library documentation. Get an API key from [Context7](https://context7.com).
- **GitHub** — Structured GitHub API access for issues, PRs, reviews, and cross-repo operations. Use a GitHub token from `gh auth token`.
- **Heroku** — App management, logs, database info, and scaling. Get a token from `heroku auth:token`.

## Plugins

### Required Plugins

Install these Claude Code plugins after initial setup:

```bash
# Ruby LSP — real-time code intelligence and diagnostics
claude plugin marketplace add boostvolt/claude-code-lsps
claude plugin install solargraph@claude-code-lsps

# Prerequisite: solargraph gem
gem install solargraph
```

### LSP Environment

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export ENABLE_LSP_TOOL=1
```

This enables Claude Code to use Language Server Protocol for real-time error detection, jump-to-definition, and find-references during editing sessions.
