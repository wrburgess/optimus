# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
