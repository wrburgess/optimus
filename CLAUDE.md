# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Permissions and Autonomy

### Branch-Based Permissions

**On feature branches (any branch except `main`):**
- **FULL AUTONOMY GRANTED** - Proceed with all changes without asking "should I proceed" or similar permission questions
- Make commits, edit files, refactor code, and implement features directly
- Run tests and linting, fix issues, and commit fixes automatically
- The only time to ask questions is for **requirement clarification** (what to build, not whether to proceed)
- User will review changes via PR before merging to main

**On `main` branch:**
- Ask before making any changes
- Require explicit user approval for commits

### How to Check Current Branch

Before starting work, check the branch:
```bash
git branch --show-current
```

If output is NOT `main`, proceed with full autonomy.

## Commit and PR Documentation Standards

**CRITICAL: All commits and PRs must have verbose, detailed documentation.**

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

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
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
Detailed explanation of:
- Design patterns used
- Why this approach was chosen
- Alternatives considered and why they were rejected
- Any performance, security, or architectural considerations

## Testing
- What was tested and how
- Edge cases covered
- Any manual testing steps performed

## Context for Future Contributors
- Why this code exists
- Common scenarios where this code will be modified
- Gotchas or areas requiring careful attention
- Related code or documentation to reference

## Checklist
- [ ] Tests pass (`bundle exec rspec`)
- [ ] Linting passes (`bundle exec rubocop -a`)
- [ ] Changes are documented in code comments where non-obvious
- [ ] PR description provides sufficient context

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Code Comment Standards

Add detailed comments for:
- Non-obvious logic or algorithms
- Business rules or domain-specific requirements
- Workarounds or temporary solutions
- Integration points with external systems
- Security considerations
- Performance optimizations

**Example:**
```ruby
# We use a background job here instead of inline processing because:
# 1. PDF generation can take 30+ seconds for large reports
# 2. Avoids request timeout issues in production
# 3. Allows us to retry on failure without user intervention
# Related: See PdfGenerationJob for retry strategy
def generate_report
  PdfGenerationJob.perform_later(report_id: id)
end
```

## Required Workflow

**ALWAYS run these checks before committing or pushing:**

```bash
bundle exec rubocop -a    # Fix lint errors
bundle exec rspec         # Run all tests
```

Both must pass before any `git commit` or `git push`. No exceptions.

## Setup After Cloning

### MCP Configuration

After cloning this repository, create a `.mcp.json` file in the project root to enable MCP (Model Context Protocol) servers. This file is gitignored because it contains API keys.

Create `.mcp.json` with the following structure:

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_CONTEXT7_API_KEY"
      }
    }
  }
}
```

Replace `YOUR_CONTEXT7_API_KEY` with your Context7 API key. You can obtain one from [Context7](https://context7.com).

Context7 provides up-to-date documentation and code examples for programming libraries, which helps Claude Code give accurate, current answers about dependencies used in this project.

## Related Projects

This repository serves as a Rails application template for the MPI Media application ecosystem. For cross-repository context, see `.claude/projects.json` which contains:

- **optimus** (this repo) - Rails application template and pattern source
- **avails** - Central data repository for MPI Media
- **sfa** - Video clip hosting and search engine
- **garden** - Static site generator for MPI sites
- **harvest** - Public-facing transaction and ecommerce platform

Each team member should create `.claude/projects.local.json` (gitignored) with their local paths to enable seamless cross-repo operations. See `.claude/projects.json` for GitHub URLs and project details.

## Commands

```bash
# Development server (runs web, js, css, worker)
bin/dev                              # Uses Procfile.development
foreman start -f Procfile.development

# Run tests
bundle exec rspec                    # All tests
bundle exec rspec spec/models/       # Directory
bundle exec rspec spec/models/user_spec.rb        # Single file
bundle exec rspec spec/models/user_spec.rb:42     # Single line

# Linting
bundle exec rubocop                  # Check all files
bundle exec rubocop -a               # Auto-correct

# Asset builds
yarn build                           # JS (esbuild)
yarn build:css                       # CSS (sass)

# Background jobs
bundle exec good_job start

# Credentials
bin/rails credentials:edit --environment development
```

## Architecture

### Authorization System

Uses Pundit with a custom permission hierarchy:
- **User** → belongs to **SystemGroups** → have **SystemRoles** → have **SystemPermissions**
- Permissions are checked via `user.access_authorized?(resource:, operation:)`
- `AdminApplicationPolicy` is the base policy for admin controllers, checking permissions by resource name and operation (`:index`, `:show`, `:create`, `:edit`, `:update`, `:destroy`, `:archive`, `:unarchive`)

### Controller Hierarchy

- `ApplicationController` - Base with Pundit integration
- `AdminController` - Authenticated admin actions with `layout "admin"`, Pagy pagination, shared archive/unarchive/destroy actions
- `ApiController` - JSON API endpoints under `/api/v1/`

### ViewComponents

Located in `app/components/` with namespace structure:
- `ApplicationComponent` - Base class including routes, Devise helpers, Pundit, and ApplicationHelper
- `app/components/admin/` - Admin UI components (headers, tables, forms, pagination)

### Frontend Stack

- **Hotwire** (Turbo + Stimulus) for interactivity
- **Bootstrap 5.3** for styling
- **Simple Form** for form helpers
- Two asset bundles: `admin.scss`/`admin.js` and `public.scss`/`public.js`
- Stimulus controllers in `app/javascript/admin/controllers/` and `app/javascript/public/controllers/`

### Admin Form Patterns

**Select inputs must use tom-select** in admin forms for consistent UI:

```erb
<%= f.input :category_id,
    as: :tom_select,
    collection: Category.options_for_select,
    label: 'Category',
    prompt: 'Select a category...',
    autocomplete: 'off',
    wrapper: :tom_select_label_inset %>
```

For multi-select inputs, add `multiple: true`:

```erb
<%= f.input :tag_ids,
    as: :tom_select,
    collection: Tag.options_for_select,
    label: 'Tags',
    prompt: 'Select tags...',
    autocomplete: 'off',
    multiple: true,
    wrapper: :tom_select_label_inset %>
```

**Other form inputs** use `wrapper: :floating_label_form`:
- Text inputs: `<%= f.input :name, wrapper: :floating_label_form %>`
- Text areas: `<%= f.input :notes, as: :text, wrapper: :floating_label_form %>`
- Booleans: `<%= f.input :active, as: :boolean, wrapper: :floating_label_form %>`

See `app/views/admin/system_groups/_form.html.erb` for reference.

### Testing

- RSpec with FactoryBot
- Use request specs for controllers (not controller specs)
- Shared contexts in `spec/support/shared_contexts/`:
  - `controller_setup` - Sets up user with full permissions for controller specs
  - `policy_setup` - Sets up user with full permissions for policy specs
- `login_user` macro available for authentication in specs

### Key Gems

- **good_job** - Async job processing (Postgres-backed)
- **ransack** - Search/filtering on index pages
- **pagy** - Pagination
- **maintenance_tasks** - Data maintenance scripts
- **caxlsx_rails** - Excel exports

### Model Concerns

- `Archivable` - Soft delete via `archived_at` timestamp
- `Loggable` - Audit logging to `data_logs` table
- `Notifiable` - Trigger notifications via Topic/Subscriber pattern

### Enumerable Pattern

For enumerable constants (status values, type options, categories):

1. **Define constants in `app/modules/`** (e.g., `app/modules/order_statuses.rb`):
   ```ruby
   module OrderStatuses
     PENDING = "pending".freeze
     SHIPPED = "shipped".freeze
     DELIVERED = "delivered".freeze

     def self.all
       [PENDING, SHIPPED, DELIVERED]
     end

     def self.options_for_select
       all.map { |item| [item.titleize, item] }
     end
   end
   ```

2. **Create a concern in `app/models/concerns/`** that references the module (e.g., `has_order_status.rb`):
   ```ruby
   module HasOrderStatus
     extend ActiveSupport::Concern

     included do
       validates :status, presence: true, inclusion: { in: OrderStatuses.all }
     end

     class_methods do
       def statuses
         OrderStatuses.all
       end
     end
   end
   ```

3. **Models include the concern**, not the module directly
4. **Write tests for modules** in `spec/modules/`

See `app/modules/notification_distribution_methods.rb` and `app/models/concerns/has_distribution_method.rb` for reference.

### Notification System

A custom Topic/Subscriber notification system (see `docs/notification_system.md` for full documentation):

**Quick Usage:**
```ruby
# In a controller action, trigger a notification
@instance.notify_topic("resource.action", context: { model: @instance, actor: current_user })
```

**Components:**
- `NotificationTopic` - Types of notifications (e.g., "user.created")
- `NotificationTemplate` - ERB templates for rendering content
- `NotificationSubscription` - Links users to topics with delivery preferences
- `NotificationMessage` - Rendered notification content
- `NotificationQueueItem` - Delivery scheduling and status

**Delivery Frequencies:** immediate, summarized_hourly, summarized_daily

**Adding New Notifications:**
1. Create topic in `db/seeds/notification_topics.rb`
2. Include `Notifiable` in model
3. Call `notify_topic("topic.key", context: {...})` in controller
4. Run `rails db:seed`

See `docs/notification_system_agent_guide.md` for detailed implementation patterns.

### Mounted Engines (Admin)

Available at `/admin/*` for admin users:
- `/admin/blazer` - SQL queries
- `/admin/good_job` - Job dashboard
- `/admin/maintenance_tasks` - Maintenance tasks
- `/admin/pghero` - Database performance
- `/admin/lookbook` - Component preview (dev/staging only)
