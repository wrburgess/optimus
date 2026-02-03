# Optimus Architecture Overview

This document provides a comprehensive overview of the Optimus application architecture for AI agents and developers working in the codebase.

## Application Purpose

Optimus is the Rails application template and reference implementation for the MPI Media application ecosystem. It defines the coding standards, architectural patterns, and development workflows used across all MPI projects (avails, sfa, garden, harvest).

## Tech Stack

- Ruby 4.0.1 / Rails 8.1.2
- PostgreSQL 17.6 (extensions: citext, pgcrypto, plpgsql)
- Hotwire (Turbo + Stimulus) for interactivity
- Bootstrap 5.3 for styling
- ViewComponent for component-based UI
- esbuild for JS bundling, Sass for CSS
- GoodJob for background job processing (Postgres-backed)

## Model Relationships

### Authorization Chain

```
User
  → has_many SystemGroups (through system_group_users)
    → has_many SystemRoles (through system_group_system_roles)
      → has_many SystemPermissions (through system_role_system_permissions)
```

Each `SystemPermission` stores a `resource` (e.g., "User") and `operation` (e.g., "index", "create", "destroy"). Permissions are checked via `user.access_authorized?(resource:, operation:)` which queries through the full chain. The User model caches all permissions in a Set to avoid N+1 queries — one query per request.

### Notification System

```
NotificationTopic (defines notification types, unique "key" field)
  → has_many NotificationTemplates (ERB subject + body, per distribution_method)
  → has_many NotificationSubscriptions (user opt-in, per distribution_method + frequency)
    → has_many NotificationQueueItems (scheduled delivery)
  → has_many NotificationMessages (rendered content)
```

**Distribution methods:** email, sms, chat
**Delivery frequencies:** immediate, summarized_hourly, summarized_daily

**Flow:** `model.notify_topic("key", context:)` → `NotifyTopicJob` → creates messages and queue items → `ProcessImmediateNotificationsJob` or scheduled summarized jobs → `DistributeNotificationJob` delivers via email/SMS/chat.

### Audit Logging

`DataLog` is a polymorphic model that records all CRUD operations. Models include the `Loggable` concern which asynchronously creates audit entries via `CreateDataLogJob`. Each log captures the user, operation, metadata, and original data as JSONB.

## Controller Hierarchy

```
ApplicationController
├── Pundit::Authorization integration
├── Rescues Pundit::NotAuthorizedError
│
├── AdminController
│   ├── layout "admin"
│   ├── before_action: authenticate_user!, authorize_user!
│   ├── Pagy pagination
│   ├── Shared actions: destroy, archive, unarchive
│   └── Admin::*Controller (all admin resources)
│
├── ApiController
│   ├── skip_forgery_protection
│   ├── JWT authentication via JsonWebTokenService
│   └── Routes under /api/v1/ (JSON default)
│
└── StaticController (public pages)
```

### Admin Controller Pattern

Every admin controller follows this pattern:
- Ransack for search/filtering on index
- Pagy for pagination
- `authorize` called on every action (Pundit)
- `policy_scope` for index queries
- XLSX export via caxlsx_rails
- Logging of all operations via Loggable concern
- Many-to-many association management via `update_associations`

## Authorization (Pundit)

- `AdminApplicationPolicy` is the base policy for all admin controllers
- Policy methods call `user_access_authorized?(resource:, operation:)` which delegates to `User#access_authorized?`
- Standard operations defined in `app/modules/system_operations.rb`: index, show, new, create, edit, update, destroy, archive, unarchive, collection_export_xlsx, member_export_xlsx, copy

## Authentication (Devise)

Devise modules enabled: confirmable, database_authenticatable, lockable, recoverable, rememberable, timeoutable, trackable, validatable.

## Background Jobs

All jobs use GoodJob (Postgres-backed, no Redis needed).

| Job | Purpose |
|-----|---------|
| `NotifyTopicJob` | Entry point for notification processing |
| `ProcessImmediateNotificationsJob` | Batch send immediate notifications |
| `ProcessSummarizedNotificationsJob` | Batch send hourly/daily digests |
| `DistributeNotificationJob` | Deliver single notification (row-level lock) |
| `DistributeSummarizedNotificationsJob` | Deliver batched digest |
| `CreateDataLogJob` | Async audit log creation |

## Routes Structure

```ruby
root → static#index
devise_for :users

namespace :admin do
  root → dashboard#index
  resources: system_groups, system_roles, system_permissions,
             users, notification_topics, notification_templates,
             notification_subscriptions, notification_messages (index/show),
             notification_queue_items (index/show), data_logs (index/show)

  # Mounted engines (system_manager access)
  /admin/blazer       → SQL queries
  /admin/good_job     → Job dashboard
  /admin/maintenance_tasks → Maintenance scripts
  /admin/pghero       → Database performance
  /admin/lookbook     → Component preview (dev/staging only)
end

namespace :api/v1 (JSON default)
```

**Route concerns:** `:archivable` (archive/unarchive), `:copyable` (copy), `:collection_exportable` (XLSX export), `:member_exportable` (single-record XLSX).

## ViewComponents

Located in `app/components/` with a directory-per-component structure:

```
app/components/admin/table_for_index/
  ├── component.rb          # Ruby logic (inherits ApplicationComponent)
  └── component.html.erb    # ERB template
```

`ApplicationComponent` includes Rails routes, Devise helpers, Pundit authorization, and ApplicationHelper.

Key admin components: form builders (form_button, header_for_new/edit/show), table builders (table_for_index, table_for_show, table_for_associations), utilities (action_button, archived_badge, filter_card, pagination).

Previews in `spec/components/previews/`, viewable via Lookbook at `/admin/lookbook`.

## Frontend Architecture

Two separate asset bundles:
- `admin.scss` / `admin.js` — Admin interface
- `public.scss` / `public.js` — Public-facing pages

**Stimulus controllers** in `app/javascript/admin/controllers/`:
- `tom_select_controller.js` — Enhanced select dropdowns (search, tagging, clear)
- `form_validation_controller.js` — Client-side validation

## Enumerable Pattern

Constants (statuses, types, categories) are defined as modules in `app/modules/`:

```ruby
# app/modules/order_statuses.rb
module OrderStatuses
  PENDING = "pending".freeze
  def self.all = [PENDING, ...]
  def self.options_for_select = all.map { |item| [item.titleize, item] }
end
```

Models include a concern (in `app/models/concerns/`) that references the module, not the module directly. Tests for modules live in `spec/modules/`.

## Model Concerns

| Concern | Purpose |
|---------|---------|
| `Archivable` | Soft delete via `archived_at`. Scopes: `actives`, `archives` |
| `Loggable` | Audit logging to `data_logs` via async job |
| `Notifiable` | Trigger notifications via `notify_topic` |
| `HasDistributionMethod` | Validates email/sms/chat distribution |
| `HasDistributionFrequency` | Validates notification frequency |

## Testing Patterns

- RSpec with FactoryBot (not fixtures)
- Request specs for controllers (not controller specs)
- Shared contexts in `spec/support/shared_contexts/`:
  - `controller_setup` — User with full permissions for controller specs
  - `policy_setup` — User with full permissions for policy specs
  - `component_setup` — ViewComponent test setup
  - `feature_setup` — Integration test setup
- `login_user` macro for Devise authentication in specs
- WebMock for HTTP stubbing, VCR for cassette recording
- ActiveJob test helpers for job testing
