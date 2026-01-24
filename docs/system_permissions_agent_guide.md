# System Permissions - Agent Implementation Guide

## Purpose

This guide provides AI agents with the context needed to support and improve the System Permission system in the Optimus codebase.

**Related:** [PR #72 - Per-Request Permission Memoization](https://github.com/mpimedia/optimus/pull/72) | [Issue #70](https://github.com/mpimedia/optimus/issues/70)

---

## Quick Reference

### Permission Check Flow

```ruby
# User model (app/models/user.rb)
user.access_authorized?(resource: "User", operation: "index")
# => Checks if user has permission via: User → Groups → Roles → Permissions
```

### Key Files

| Component | Path |
|-----------|------|
| Permission check | `app/models/user.rb:58-64` |
| Permission cache | `app/models/user.rb:88-96` |
| Base policy | `app/policies/admin_application_policy.rb` |
| Operations enum | `app/modules/system_operations.rb` |
| Admin auth | `app/controllers/admin_controller.rb:41-52` |

---

## Architecture Overview

### Entity Relationship

```
User (1) ──▶ (N) SystemGroupUser (N) ◀── (1) SystemGroup
                                              │
                                              ▼
                              (N) SystemGroupSystemRole (N)
                                              │
                                              ▼
                                        SystemRole (1)
                                              │
                                              ▼
                              (N) SystemRoleSystemPermission (N)
                                              │
                                              ▼
                                      SystemPermission
                                    (resource + operation)
```

### Database Tables

```sql
-- Core tables
system_permissions (id, name, resource, operation, abbreviation, description, notes)
system_roles (id, name, abbreviation, description, notes)
system_groups (id, name, abbreviation, description, notes)

-- Join tables
system_group_users (id, system_group_id, user_id)
system_group_system_roles (id, system_group_id, system_role_id)
system_role_system_permissions (id, system_role_id, system_permission_id)
```

---

## Implementation Details

### Permission Checking (Memoized)

The `access_authorized?` method uses per-request memoization to minimize database queries:

```ruby
# app/models/user.rb

def access_authorized?(resource:, operation:)
  permissions_cache.include?([resource.to_s, operation.to_s])
end

def has_system_permission?
  permissions_cache.any?
end

private

# Memoizes all user permissions as a Set of [resource, operation] pairs.
# This reduces database queries from N (one per permission check) to 1
# (loading all permissions once per request). The cache is automatically
# cleared when Rails reloads the user object for the next request.
def permissions_cache
  @permissions_cache ||= system_permissions
                           .pluck(:resource, :operation)
                           .to_set
end
```

**Key points:**
- Cache is a Ruby `Set` for O(1) lookups
- Arguments are converted to strings for consistent matching
- Cache auto-clears between requests (instance variable scope)
- First permission check triggers 1 SQL query; subsequent checks are free

### Pundit Integration

```ruby
# app/policies/admin_application_policy.rb

class AdminApplicationPolicy < ApplicationPolicy
  def user_access_authorized?(operation)
    user.access_authorized?(resource: record.name, operation:)
  end

  def index?
    user_access_authorized?(SystemOperations::INDEX)
  end

  def show?
    user_access_authorized?(SystemOperations::SHOW)
  end

  def create?
    user_access_authorized?(SystemOperations::CREATE)
  end

  def edit?
    user_access_authorized?(SystemOperations::EDIT)
  end

  def update?
    user_access_authorized?(SystemOperations::UPDATE)
  end

  def destroy?
    user_access_authorized?(SystemOperations::DESTROY)
  end

  def archive?
    user_access_authorized?(SystemOperations::ARCHIVED)
  end

  def unarchive?
    user_access_authorized?(SystemOperations::UNARCHIVED)
  end
end
```

### Controller Authorization

```ruby
# app/controllers/admin_controller.rb

class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_user!

  private

  def authorize_user!
    if (klass = controller_class)
      authorize([:admin, klass])
    else
      authorize([:admin, controller_name.to_sym], policy_class: policy_class)
    end
  end

  def controller_class
    controller_name.classify.safe_constantize
  end

  def policy_class
    "Admin::#{controller_name.classify}Policy".constantize
  end
end
```

---

## Common Tasks

### Adding Permissions for a New Controller

When creating a new admin controller, run the maintenance task:

```bash
bin/rails maintenance_tasks:run Maintenance::EnsureModelSystemPermissionsTask
```

Or create manually:

```ruby
resource = "NewModel"
role = SystemRole.find_by!(name: "System Management")

SystemOperations.all.each do |operation|
  permission = SystemPermission.find_or_create_by!(
    resource: resource,
    operation: operation
  ) do |p|
    p.name = "#{resource} #{operation.upcase}"
    p.abbreviation = "#{resource.scan(/[A-Z]/).join} #{operation.upcase[0..2]}"
  end

  SystemRoleSystemPermission.find_or_create_by!(
    system_role: role,
    system_permission: permission
  )
end
```

### Adding a Custom Permission Check

For non-standard operations (e.g., "approve", "export"):

1. Add to `SystemOperations` module:
   ```ruby
   # app/modules/system_operations.rb
   APPROVE = "approve".freeze
   ```

2. Add to policy:
   ```ruby
   # app/policies/admin/request_policy.rb
   def approve?
     user_access_authorized?(SystemOperations::APPROVE)
   end
   ```

3. Create the permission:
   ```ruby
   SystemPermission.create!(
     name: "Request APPROVE",
     resource: "Request",
     operation: "approve"
   )
   ```

### Debugging Permission Issues

```ruby
# Check user's full permission chain
user = User.find(id)

# Groups
user.system_groups.pluck(:name)
# => ["System Managers"]

# Roles (through groups)
user.system_roles.pluck(:name)
# => ["System Management"]

# Permissions (through roles)
user.system_permissions.pluck(:resource, :operation)
# => [["User", "index"], ["User", "show"], ...]

# Direct check
user.access_authorized?(resource: "User", operation: "index")
# => true

# Check specific permission exists
SystemPermission.where(resource: "User", operation: "index").exists?
# => true
```

---

## Maintenance Tasks Reference

### EnsureModelSystemPermissionsTask

**Path:** `app/tasks/maintenance/ensure_model_system_permissions_task.rb`

**Purpose:** Auto-generate CRUD permissions for all models

**When to run:**
- After adding new models
- During initial setup
- After major refactoring

```bash
bin/rails maintenance_tasks:run Maintenance::EnsureModelSystemPermissionsTask
```

### CleanupSystemPermissionsTask

**Path:** `app/tasks/maintenance/cleanup_system_permissions_task.rb`

**Purpose:** Fix naming inconsistencies and merge duplicates

**When to run:**
- After manual permission edits
- To fix data integrity issues
- Before audits

```bash
bin/rails maintenance_tasks:run Maintenance::CleanupSystemPermissionsTask
```

### SystemPermissionsBulkCreateTask

**Path:** `app/tasks/maintenance/system_permissions_bulk_create_task.rb`

**Purpose:** Create all 9 standard permissions for one resource

**Parameters:**
- `resource_name`: Model name (e.g., "Order")
- `system_role_name`: Role to assign (e.g., "System Management")

**Operations created:** archive, create, destroy, edit, index, new, show, unarchive, update

### ImportSystemPermissionsTask

**Path:** `app/tasks/maintenance/import_system_permissions_task.rb`

**Purpose:** Bulk import from Excel spreadsheet

**WARNING:** Deletes all existing data first!

**Source file:** `db/source/system_permissions.xlsx`

---

## Testing Patterns

### Testing Permission Checks

```ruby
# spec/models/user_spec.rb

describe "#access_authorized?" do
  let(:user) { create(:user) }
  let(:system_group) { SystemGroup.create!(name: "Test Group") }
  let(:system_role) { SystemRole.create!(name: "Test Role") }
  let(:system_permission) do
    SystemPermission.create!(
      name: "Reports VIEW",
      resource: "reports",
      operation: "view"
    )
  end

  before do
    SystemGroupUser.create!(system_group:, user:)
    SystemGroupSystemRole.create!(system_group:, system_role:)
    SystemRoleSystemPermission.create!(system_role:, system_permission:)
    user.reload
  end

  it "returns true when user has permission" do
    expect(user.access_authorized?(resource: "reports", operation: "view")).to be(true)
  end

  it "returns false when user lacks permission" do
    expect(user.access_authorized?(resource: "reports", operation: "edit")).to be(false)
  end

  it "handles symbol arguments" do
    expect(user.access_authorized?(resource: :reports, operation: :view)).to be(true)
  end
end
```

### Testing Memoization

```ruby
it "memoizes permissions and only queries the database once" do
  user.reload

  query_count = 0
  counter = ->(*) { query_count += 1 }

  ActiveSupport::Notifications.subscribed(counter, "sql.active_record") do
    user.access_authorized?(resource: "reports", operation: "view")
    user.access_authorized?(resource: "reports", operation: "edit")
    user.access_authorized?(resource: "other", operation: "view")
  end

  expect(query_count).to eq(1)
end
```

### Testing Policies

```ruby
# spec/policies/admin/user_policy_spec.rb

RSpec.describe Admin::UserPolicy do
  include_context "policy_setup"

  let(:record) { User }

  describe "index?" do
    it "allows users with User index permission" do
      expect(policy.index?).to be(true)
    end
  end
end
```

The `policy_setup` shared context (`spec/support/shared_contexts/policy_setup.rb`) creates a user with full permissions.

---

## Performance Considerations

### Current Optimization (PR #72)

**Before:** Each `access_authorized?` call triggered a database query
```ruby
# Old implementation
def access_authorized?(resource:, operation:)
  system_permissions.where(resource:, operation:).exists?
end
# Result: 20+ queries per page load
```

**After:** Single query loads all permissions into a Set
```ruby
# Current implementation
def access_authorized?(resource:, operation:)
  permissions_cache.include?([resource.to_s, operation.to_s])
end
# Result: 1 query per page load
```

### Future Optimization Options

1. **Cross-request caching (Redis):**
   - Store permissions in Redis with user-specific key
   - Invalidate on permission change
   - Tradeoff: Added complexity, cache invalidation challenges

2. **Database denormalization:**
   - Add `permissions_json` column to users table
   - Update via callbacks when permissions change
   - Tradeoff: Data consistency challenges

3. **Request-store gem:**
   - Share cache across controllers/views in same request
   - Currently unnecessary since User instance is reused

**Current approach is optimal** for typical usage patterns. Permissions are small (~100 entries max) and Set operations are O(1).

---

## Checklist: Adding a New Protected Resource

- [ ] Create the model (if needed)
- [ ] Create the admin controller extending `AdminController`
- [ ] Create policy extending `AdminApplicationPolicy` (or use default)
- [ ] Run `EnsureModelSystemPermissionsTask` to create permissions
- [ ] Verify permissions exist in admin UI
- [ ] Assign permissions to appropriate roles
- [ ] Test access with user in that role
- [ ] Write policy specs

---

## Error Handling

### Common Errors

**`Pundit::NotAuthorizedError`**
- User lacks required permission
- Check: `user.access_authorized?(resource: "X", operation: "y")`

**`NoMethodError: undefined method 'name' for nil:NilClass`**
- Policy `record` is nil
- Check controller is passing correct record to `authorize`

**Permission check returns false unexpectedly**
- Ensure user.reload was called after permission changes
- Check permission resource matches controller name exactly (case-sensitive)

### Debugging Commands

```ruby
# Rails console
user = User.find(id)

# View permission chain
puts "Groups: #{user.system_groups.pluck(:name)}"
puts "Roles: #{user.system_roles.pluck(:name)}"
puts "Permissions: #{user.system_permissions.count}"

# Check specific permission
user.access_authorized?(resource: "User", operation: "index")

# View all user permissions
user.system_permissions.pluck(:resource, :operation).sort

# Find orphaned permissions (not assigned to any role)
SystemPermission.left_joins(:system_roles).where(system_roles: { id: nil })
```
