# AGENTS.md

Instructions for all AI coding agents (Codex, Copilot, Claude Code, and others) working in this repository.

## Project Overview

Optimus is a Ruby on Rails application template for the MPI Media ecosystem. It serves as the reference implementation for coding standards, architectural patterns, and development workflows.

**Tech Stack:** Ruby 4.0.1 / Rails 8.1.2 / PostgreSQL 17.6 / Hotwire (Turbo + Stimulus) / Bootstrap 5.3 / ViewComponent

## Dev Environment

```bash
bin/dev                    # Start development server (web, js, css, worker)
bin/rails console          # Rails console
bin/rails db:migrate       # Run migrations
bin/rails db:seed          # Seed development data
```

## Testing Instructions

```bash
bundle exec rspec                              # All tests
bundle exec rspec spec/models/user_spec.rb     # Single file
bundle exec rspec spec/models/user_spec.rb:42  # Single line
bundle exec rspec spec/models/                 # Directory
```

- RSpec with FactoryBot (never fixtures)
- Request specs for controllers (not controller specs)
- Shoulda-matchers for validations and associations
- Minimize mocks and stubs — use real objects
- See `docs/standards/testing.md` for full conventions

## Linting

```bash
bundle exec rubocop        # Check all files
bundle exec rubocop -a     # Auto-correct
```

Uses **rubocop-rails-omakase** with `rubocop-rspec`, `rubocop-capybara`, `rubocop-factory_bot` plugins.

## Security Scanning

```bash
bin/brakeman               # Static analysis
bin/bundler-audit           # Vulnerable dependencies
```

## Pre-Commit Requirements

**All of these must pass before committing:**

1. `bundle exec rubocop -a` — zero offenses
2. `bundle exec rspec` — zero failures

No exceptions.

## PR Instructions

- PR title: under 70 characters, descriptive
- PR body: Summary, Changes Made, Technical Approach, Testing, Checklist
- Link to issue: `Closes #NNN` or `Part of #NNN`
- Agent attribution required (see below)

## Review Guidelines

When reviewing code, check for:

### P0 — Must Fix
- Security vulnerabilities (SQL injection, XSS, missing authorization)
- Missing `authorize` call in admin controller actions
- Broken tests or tests that don't test what they claim
- Credentials or secrets in code
- Data loss risks (irreversible migrations, missing `dependent:`)

### P1 — Should Fix
- N+1 queries (use `includes` / `eager_load`)
- Missing validations for required business constraints
- Pattern violations (see Architecture section below)
- Missing tests for new functionality
- Ransack attributes exposing sensitive fields

### P2 — Consider
- Naming improvements
- Code organization suggestions
- Performance optimizations
- Additional edge case coverage

## Multi-Agent Coordination

When multiple agents work on the same feature:

- **File ownership is exclusive** — no two agents modify the same file simultaneously
- **Shared interfaces must be defined upfront** — method signatures, model attributes, route paths
- **Migrations belong to one agent** — typically the model/data stream
- **Each agent runs pre-commit checks on its own scope** before committing
- **One agent handles integration** — merges streams, runs full test suite, creates PR

See `docs/architecture/agent-workflow.md` for the full multi-agent workflow and orchestration patterns.

## Architecture

### Authorization

```
User → SystemGroups → SystemRoles → SystemPermissions
```

- Pundit policies inherit from `AdminApplicationPolicy`
- Every admin action must call `authorize`
- Permissions checked via `user.access_authorized?(resource:, operation:)`
- Operations defined in `app/modules/system_operations.rb`

### Controllers

- `AdminController` base: authenticated, authorized, Pagy pagination, layout "admin"
- `ApiController` base: JWT auth, JSON default, `/api/v1/`
- Use `controller_class` helper (not hard-coded class names)
- Redirects use `polymorphic_path([:admin, instance])`
- Soft delete via `archive` (never hard destroy on archivable records)
- Every mutation logged via `.log(user:, operation:, meta:, original_data:)`

### Models

- Include concerns: `Archivable` (soft delete), `Loggable` (audit trail), `Notifiable` (events)
- Enumerable constants: module in `app/modules/` + concern in `app/models/concerns/`
- Define `ransackable_attributes` and `ransackable_associations` for security
- Provide `self.options_for_select` for form dropdowns

### Views & Components

- ViewComponents in `app/components/admin/` (directory-per-component pattern)
- Forms: tom-select for selects (`wrapper: :tom_select_label_inset`), floating labels for text (`wrapper: :floating_label_form`)
- Bootstrap 5.3 for all styling
- Hotwire (Turbo + Stimulus) for interactivity — no other JS frameworks

### Background Jobs

- GoodJob (Postgres-backed, no Redis)
- Notification pipeline: `NotifyTopicJob` → `ProcessImmediateNotificationsJob` → `DistributeNotificationJob`
- Audit logging: `CreateDataLogJob`

## Agent Attribution (Required — No Exceptions)

Every AI agent **must** include attribution on all work:

- **Commits**: `Co-Authored-By: Agent Name <email>` trailer
- **PRs**: Agent name in description footer
- **Comments**: Attribution line (e.g., `— Claude Code (Opus 4.5)` or `— GitHub Copilot`)

If multiple agents contribute, include a `Co-Authored-By` line for each.

## Standards Documents

Detailed standards are in `docs/standards/`:
- `docs/standards/testing.md` — Test conventions and spec structure
- `docs/standards/code-review.md` — Review checklist for all reviewers
- `docs/standards/design.md` — UI/UX patterns and component conventions
- `docs/standards/style.md` — Naming conventions and formatting rules
- `docs/standards/documentation.md` — When and where to write docs
- `docs/standards/hc-review-checklist.md` — Human reviewer checklist

## Context7 MCP Query Strategy (Claude Code)

This section is for Claude Code agents with Context7 MCP configured.

- Always use Context7 MCP for library documentation before falling back to general knowledge
- Refer to `.tool-versions`, `Gemfile`, and `package.json` for exact dependency versions

### Core Libraries (Query in Priority Order)

1. `/websites/guides_rubyonrails_v8_0` — Rails framework
2. `/websites/ruby-lang_en` — Ruby language
3. `/websites/postgresql_17` — PostgreSQL
4. `/hotwired/turbo-rails` — Turbo/Hotwire
5. `/hotwired/stimulus-rails` — Stimulus JS
6. `/websites/getbootstrap_5_3` — Bootstrap
7. `/rspec/rspec-rails` — Testing
8. `/viewcomponent/view_component` — ViewComponent
9. `/rubocop/rubocop` — Linting

### Additional Libraries (Query as Needed)

- `/heartcombo/devise` — Authentication
- `/varvet/pundit` — Authorization
- `/heartcombo/simple_form` — Form builder
- `/faker-ruby/faker` — Test data
- `/bensheldon/good_job` — Async jobs
- `/caxlsx/caxlsx` — Excel exports
- `/shopify/maintenance_tasks` — Maintenance tasks
- `/activerecord-hackery/ransack` — Search
- `/thoughtbot/factory_bot_rails` — Factories
- `/teamcapybara/capybara` — Browser testing
