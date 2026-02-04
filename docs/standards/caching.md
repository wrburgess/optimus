# MPI Caching Standards

## Cache Store Configuration

| Environment | Store | Purpose |
|-------------|-------|---------|
| **Production** | `solid_cache_store` | Database-backed cache via SolidCache gem |
| **Staging** | `solid_cache_store` | Matches production behavior |
| **Development** | `memory_store` | Fast, toggleable via `bin/rails dev:cache` |
| **Test** | `null_store` | No caching — tests run against uncached code |

Toggle caching in development:

```bash
bin/rails dev:cache  # Creates/removes tmp/caching-dev.txt
```

## Fragment Caching

Cache rendered HTML fragments in views and partials to avoid repeated rendering.

### Basic Fragment Cache

```erb
<% cache @user do %>
  <div class="user-card">
    <h3><%= @user.name %></h3>
    <p><%= @user.email %></p>
    <p>Groups: <%= @user.system_groups.map(&:name).join(", ") %></p>
  </div>
<% end %>
```

The cache key is derived from `@user.cache_key_with_version`, which includes the model's `id` and `updated_at` timestamp. When the user is updated, the cache key changes and a fresh fragment is rendered.

### Collection Caching

For rendering lists of records, use collection caching to cache each item independently:

```erb
<%= render partial: "admin/users/user", collection: @users, cached: true %>
```

This caches each `_user.html.erb` partial individually. When one user updates, only that user's fragment is re-rendered.

### Russian Doll Caching

Nest cached fragments so that updating a child invalidates its parent:

```erb
<% cache @post do %>
  <h2><%= @post.title %></h2>

  <% @post.comments.each do |comment| %>
    <% cache comment do %>
      <p><%= comment.body %> — <%= comment.author.name %></p>
    <% end %>
  <% end %>
<% end %>
```

For this to work, the child must `touch` its parent:

```ruby
class Comment < ApplicationRecord
  belongs_to :post, touch: true
end
```

When a comment is created or updated, `post.updated_at` changes, busting the outer cache.

## Cache Invalidation with `touch`

Use `touch: true` on `belongs_to` associations to propagate cache invalidation up the hierarchy:

```ruby
class NotificationSubscription < ApplicationRecord
  belongs_to :notification_topic, touch: true
  belongs_to :user, touch: true
end
```

### When to Use `touch: true`

- The parent's cached view includes data from the child
- You use Russian doll caching
- The parent has a "last modified" display

### When NOT to Use `touch: true`

- The parent has many children that update frequently (causes excessive cache busting)
- The parent's view doesn't include child data
- The child is a log/audit record (e.g., `DataLog`) — touching the parent on every log entry would thrash the cache

## ViewComponent Caching

ViewComponents can be cached like any other fragment:

```erb
<% cache @user do %>
  <%= render Admin::UserCard::Component.new(user: @user) %>
<% end %>
```

Or cache inside the component template:

```erb
<%# app/components/admin/stats_panel/component.html.erb %>
<% cache "stats_panel_#{Date.current}" do %>
  <div class="stats-panel">
    <%= render_stat("Users", User.count) %>
    <%= render_stat("Active", User.actives.count) %>
  </div>
<% end %>
```

Use time-based keys (`Date.current`, `Time.current.beginning_of_hour`) for content that should refresh periodically.

## Cache Key Patterns

### Model-Based Keys (Automatic)

```ruby
cache @user  # => "users/42-20260203150000000000"
```

Uses `cache_key_with_version` which includes `id` and `updated_at`.

### Explicit Keys

```erb
<% cache ["v1", "dashboard", current_user, Date.current] do %>
  <%# Dashboard content that changes daily per user %>
<% end %>
```

### Versioned Keys

When you change the structure of a cached fragment, bump the version to invalidate all existing caches:

```erb
<% cache ["v2", @user] do %>
  <%# Changed layout — v1 caches are now stale %>
<% end %>
```

## Low-Level Caching

For caching arbitrary data (not HTML), use `Rails.cache` directly:

```ruby
# Cache a computation for 1 hour
stats = Rails.cache.fetch("dashboard_stats", expires_in: 1.hour) do
  {
    total_users: User.count,
    active_users: User.actives.count,
    pending_notifications: NotificationQueueItem.pending.count
  }
end
```

### Conditional Fetching

```ruby
Rails.cache.fetch("user_#{user.id}_permissions", expires_in: 15.minutes) do
  user.system_permissions.pluck(:resource, :operation).to_set
end
```

Note: Optimus already implements per-request permission caching via `@permissions_cache` in the `User` model (`app/models/user.rb`). This is preferred over `Rails.cache` for request-scoped data because it doesn't persist stale permissions across requests.

## When to Cache

| Scenario | Cache? | Approach |
|----------|--------|----------|
| Expensive query result used multiple times per request | Yes | Memoization (`@var ||=`) |
| Expensive query result used across requests | Yes | `Rails.cache.fetch` with TTL |
| Rendered partial that rarely changes | Yes | Fragment cache with model key |
| Index page with paginated results | Maybe | Only if rendering is slow (> 100ms) |
| Show page with nested associations | Yes | Russian doll caching |
| Admin dashboard with aggregate stats | Yes | Low-level cache with time-based expiry |

## When NOT to Cache

| Scenario | Why |
|----------|-----|
| User-specific dynamic content behind auth | Cache key must include user, reducing hit rate |
| Content that changes on every request | Cache writes with zero hits waste resources |
| Forms and form tokens | CSRF tokens must be unique per request |
| Flash messages | They're consumed once and must not persist |
| Pages during active development | Stale caches cause confusion during development |
| Small/fast partials | Caching overhead exceeds rendering cost |

## Cache Warming

For content that's expensive to generate and requested frequently, consider warming the cache proactively:

```ruby
# app/jobs/warm_dashboard_cache_job.rb
class WarmDashboardCacheJob < ApplicationJob
  def perform
    Rails.cache.write("dashboard_stats", compute_stats, expires_in: 1.hour)
  end

  private

  def compute_stats
    { total_users: User.count, active_users: User.actives.count }
  end
end
```

Schedule via GoodJob cron or a recurring task.

## Performance Debugging

Check whether caching is active:

```ruby
Rails.cache.class        # => ActiveSupport::Cache::SolidCacheStore (production)
Rails.application.config.action_controller.perform_caching  # => true/false
```

View cache hits/misses in development logs:

```
Read fragment views/users/42-20260203150000 (0.3ms)
Write fragment views/users/42-20260203150000 (1.2ms)
```

## Reference

- [Rails Caching Guide](https://guides.rubyonrails.org/caching_with_rails.html)
- [SolidCache gem](https://github.com/rails/solid_cache)
- [ViewComponent caching](https://viewcomponent.org/guide/performance.html)
