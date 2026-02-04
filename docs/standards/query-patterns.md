# MPI ActiveRecord Query Patterns

## Eager Loading

### `includes` (Default Choice)

Use `includes` to prevent N+1 queries. It chooses between `preload` (separate queries) and `eager_load` (LEFT OUTER JOIN) automatically based on whether conditions reference the association.

```ruby
# Index action — load associations used in views
@q = User.includes(:system_groups, :system_roles).ransack(params[:q])
@pagy, @instances = pagy(@q.result)

# Show action — load associations for detail page
@instance = NotificationSubscription.includes(:notification_topic, :user).find(params[:id])
```

### `preload` vs `eager_load`

Use these directly when you need explicit control:

| Method | SQL Strategy | Use When |
|--------|-------------|----------|
| `preload` | Separate `SELECT` per association | Associations are displayed but not filtered |
| `eager_load` | Single `LEFT OUTER JOIN` | You filter or sort by association columns |
| `includes` | Auto-selects one of the above | Default — let Rails decide |

```ruby
# preload — two queries, no join
User.preload(:system_groups).where(active: true)

# eager_load — single query with LEFT JOIN
User.eager_load(:system_groups).where(system_groups: { name: "Admins" })
```

### Nested Eager Loading

```ruby
# Load topic → templates → subscriptions in one pass
NotificationTopic.includes(notification_templates: :notification_subscriptions)
```

## Selecting Specific Columns

### `select` — Returns ActiveRecord Objects

```ruby
# Only load columns needed for the view
User.select(:id, :first_name, :last_name, :email).where(active: true)
```

### `pluck` — Returns Raw Arrays

Use `pluck` when you don't need model instances — it skips ActiveRecord object instantiation:

```ruby
# Efficient — returns [["User", "index"], ["User", "show"], ...]
permissions = user.system_permissions.pluck(:resource, :operation)

# For select options
Category.actives.order(:name).pluck(:name, :id)
```

**Rule:** Use `pluck` for data extraction. Use `select` when you need to call model methods on the results.

### `pick` — Single Value

```ruby
# Returns one value, not an array
User.where(email: "admin@example.com").pick(:id)
```

## Batch Processing

### `find_each` — Process Records in Batches

Use for iterating over large result sets. Loads records in batches of 1000 (default) to avoid loading everything into memory:

```ruby
# Process all pending notifications
NotificationQueueItem.pending.find_each do |item|
  DistributeNotificationJob.perform_later(notification_queue_item_id: item.id)
end

# Custom batch size
User.actives.find_each(batch_size: 500) do |user|
  user.recalculate_permissions!
end
```

### `in_batches` — Process Batches as Relations

Use when you need to operate on the batch as a whole rather than individual records:

```ruby
# Bulk update in batches
User.where(legacy: true).in_batches(of: 1000) do |batch|
  batch.update_all(migrated_at: Time.current)
end
```

### When to Use Batch Processing

- Iterating over more than ~100 records
- Background jobs that process large datasets
- Maintenance tasks
- Data exports (except XLSX exports, which use raw SQL — see below)

## Existence Checks

### `exists?` — Efficient Existence Check

Returns `true`/`false` with a `SELECT 1 ... LIMIT 1` query. Does NOT load the record:

```ruby
# GOOD — single efficient query
if user.system_groups.exists?(name: "System Managers")
  # ...
end

# GOOD — check if any records match
if NotificationQueueItem.pending.exists?
  ProcessImmediateNotificationsJob.perform_later
end
```

### Avoid `present?` for Existence Checks

```ruby
# BAD — loads all records into memory, then checks if array is non-empty
if user.system_groups.where(name: "Admins").present?

# GOOD — SELECT 1 ... LIMIT 1
if user.system_groups.exists?(name: "Admins")
```

### `any?` and `none?`

```ruby
# These use EXISTS under the hood when called on a relation
if @notifications.any?    # => SELECT 1 FROM notifications LIMIT 1
if @notifications.none?   # => SELECT 1 FROM notifications LIMIT 1, then negate
```

**Note:** `any?` and `none?` load all records if the relation has already been loaded (e.g., after `.to_a`). Use `exists?` when you want to guarantee a database query.

## Scopes

### Naming Conventions

```ruby
class NotificationQueueItem < ApplicationRecord
  # State scopes — named after the state
  scope :pending, -> { where(distributed_at: nil) }
  scope :distributed, -> { where.not(distributed_at: nil) }

  # Filter scopes — prefixed with "for_"
  scope :for_user, ->(user) { where(user: user) }
  scope :for_method, ->(method) { where(distribution_method: method) }

  # Time-based scopes — describe the condition
  scope :ready_to_distribute, -> { pending.where("distribute_at <= ?", Time.current) }

  # Ordering scope — every model has one
  scope :select_order, -> { order(distribute_at: :asc) }
end
```

### Scope Composition with `merge`

Combine scopes from different models:

```ruby
# Combine NotificationQueueItem scopes with NotificationSubscription scopes
scope :immediate, -> {
  joins(:notification_subscription)
    .where(notification_subscriptions: { distribution_frequency: "immediate" })
}

# Or using merge for cleaner cross-model scope composition
scope :immediate, -> {
  joins(:notification_subscription).merge(NotificationSubscription.immediate)
}
```

### Default Sort

Every model defines a default sort used by Ransack:

```ruby
def self.default_sort
  "name asc"
end
```

## Joins

### `joins` — Inner Join

Use when you need to filter by association columns but don't need the associated records in the result:

```ruby
# Find users who belong to a specific group
User.joins(:system_groups).where(system_groups: { name: "Admins" })
```

### `left_joins` — Left Outer Join

Use when you need to include records that have no matching association:

```ruby
# Find users WITH and WITHOUT groups
User.left_joins(:system_groups).select("users.*, COUNT(system_groups.id) AS group_count")
    .group("users.id")
```

### Avoid N+1 with Joins

`joins` does NOT eager-load the association data. If you access the joined association in a loop, you still get N+1:

```ruby
# BAD — joins does not load system_groups into memory
User.joins(:system_groups).each { |u| puts u.system_groups.map(&:name) }

# GOOD — use includes when you access the association data
User.includes(:system_groups).each { |u| puts u.system_groups.map(&:name) }
```

## Counter Caches

Use counter caches when you frequently display association counts to avoid `COUNT(*)` queries:

```ruby
# Migration
add_column :notification_topics, :notification_subscriptions_count, :integer, default: 0, null: false

# Model
class NotificationSubscription < ApplicationRecord
  belongs_to :notification_topic, counter_cache: true
end

# Usage — no query needed
@topic.notification_subscriptions_count  # reads the cached column
```

### When to Add Counter Caches

- The count is displayed on index or show pages
- The count is used for sorting or filtering
- The association has many records and `COUNT(*)` is slow

### When NOT to Add Counter Caches

- The count is rarely displayed
- The association changes frequently (counter updates add write overhead)
- You need filtered counts (counter cache only tracks total)

## Pessimistic Locking

Use `with_lock` for operations where concurrent access could cause data corruption:

```ruby
# app/jobs/distribute_notification_job.rb
item = NotificationQueueItem.find(id)
item.with_lock do
  return if item.distributed?
  # ... distribute notification
  item.mark_distributed!
end
```

This issues `SELECT ... FOR UPDATE`, blocking other transactions from reading the same row until the block completes.

### When to Use Locking

- Jobs that process queue items (prevent double-processing)
- Financial or inventory operations
- Any operation where two concurrent requests could produce an invalid state

## Raw SQL

Use raw SQL for complex reports and exports where ActiveRecord's query interface becomes unwieldy:

```ruby
# app/controllers/admin/users_controller.rb — XLSX export
sql = %(
  SELECT users.id, users.first_name, users.last_name, users.email,
         string_agg(DISTINCT system_groups.name, ', ') AS groups
  FROM users
  LEFT JOIN system_group_users ON system_group_users.user_id = users.id
  LEFT JOIN system_groups ON system_groups.id = system_group_users.system_group_id
  WHERE users.archived_at IS NULL
  GROUP BY users.id, users.first_name, users.last_name, users.email
  ORDER BY users.last_name ASC
)
@results = ActiveRecord::Base.connection.select_all(sql)
```

### Raw SQL Guidelines

- **Use for exports only** — CRUD operations should use ActiveRecord
- **Always parameterize user input** — never interpolate params into SQL strings
- **Use `select_all`** — returns lightweight `ActiveRecord::Result`, not model instances
- **Document the query** — raw SQL is harder to maintain; add a comment explaining what it does

```ruby
# BAD — SQL injection risk
sql = "SELECT * FROM users WHERE name = '#{params[:name]}'"

# GOOD — parameterized
sql = "SELECT * FROM users WHERE name = $1"
ActiveRecord::Base.connection.select_all(sql, "User Query", [[nil, params[:name]]])

# GOOD — use ActiveRecord for anything with user input
User.where(name: params[:name])
```

## Ransack Security

Every model that uses Ransack must explicitly define searchable attributes and associations:

```ruby
class User < ApplicationRecord
  def self.ransackable_attributes(auth_object = nil)
    %w[first_name last_name email created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[system_groups system_roles]
  end
end
```

**Never return `column_names`** or allow all attributes — this exposes sensitive columns to search.

## Performance Checklist

Before committing query-heavy code, verify:

- [ ] No N+1 queries — check `log/bullet.log` after running specs
- [ ] `includes` used in controller actions that render associations
- [ ] `pluck` used instead of `map` when only values are needed
- [ ] `exists?` used instead of `present?` for existence checks
- [ ] `find_each` used for iterating over large datasets
- [ ] Ransackable attributes are explicitly defined (no `column_names`)
- [ ] Raw SQL is parameterized (no string interpolation of user input)
- [ ] Indexes exist for columns used in `where`, `order`, and `joins` clauses

## Reference

- [Active Record Query Interface](https://guides.rubyonrails.org/active_record_querying.html)
- [Bullet gem](https://github.com/flyerhzm/bullet) — N+1 detection
- [PgHero](https://github.com/ankane/pghero) — database performance dashboard
- [Ransack](https://github.com/activerecord-hackery/ransack) — search and filtering
