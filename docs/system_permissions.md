# System Permissions Documentation

## Overview

The Optimus System Permission system implements Role-Based Access Control (RBAC) using Pundit for authorization. It provides a flexible, hierarchical permission structure that controls access to admin resources throughout the application.

**Related:** [PR #72 - Per-Request Permission Memoization](https://github.com/wrburgess/optimus/pull/72) optimized this system for performance.

## Architecture

### Permission Hierarchy

```
┌─────────┐     ┌──────────────────┐     ┌────────────┐     ┌──────────────────┐
│  User   │────▶│   SystemGroup    │────▶│ SystemRole │────▶│ SystemPermission │
│         │     │ (e.g., Managers) │     │ (e.g., Admin)   │ (e.g., User index)│
└─────────┘     └──────────────────┘     └────────────┘     └──────────────────┘
      │                   │                     │                     │
      │    SystemGroupUser│      SystemGroupSystemRole    SystemRoleSystemPermission
      │     (join table)  │        (join table)  │           (join table)
      └───────────────────┘──────────────────────┘───────────────────────┘
```

### Data Flow

1. **User** belongs to one or more **SystemGroups** (via `SystemGroupUser`)
2. **SystemGroup** has one or more **SystemRoles** (via `SystemGroupSystemRole`)
3. **SystemRole** has one or more **SystemPermissions** (via `SystemRoleSystemPermission`)
4. **SystemPermission** defines a specific `resource` + `operation` pair

### Core Components

| Component | Description | Example |
|-----------|-------------|---------|
| `User` | End user with system access | `admin@example.com` |
| `SystemGroup` | Organizational grouping of users | "System Managers", "Content Editors" |
| `SystemRole` | Functional role with permissions | "Administrator", "Viewer" |
| `SystemPermission` | Granular access right | `resource: "User", operation: "index"` |

---

## Database Schema

### system_permissions

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `name` | string | Human-readable name (e.g., "User INDEX") |
| `resource` | string | Model/controller name (e.g., "User") |
| `operation` | string | Action name (e.g., "index", "create") |
| `abbreviation` | string | Short code (e.g., "USR IDX") |
| `description` | string | Optional description |
| `notes` | text | Optional notes |

### system_roles

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `name` | string | Role name (e.g., "System Management") |
| `abbreviation` | string | Short code |
| `description` | string | Optional description |
| `notes` | text | Optional notes |

### system_groups

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `name` | string | Group name (e.g., "System Managers") |
| `abbreviation` | string | Short code |
| `description` | string | Optional description |
| `notes` | text | Optional notes |

### Join Tables

- `system_group_users` - Links users to groups
- `system_group_system_roles` - Links groups to roles
- `system_role_system_permissions` - Links roles to permissions

---

## Available Operations

The `SystemOperations` module (`app/modules/system_operations.rb`) defines all valid operations:

| Operation | Description |
|-----------|-------------|
| `index` | View list of resources |
| `show` | View single resource |
| `new` | Access new resource form |
| `create` | Create new resource |
| `edit` | Access edit form |
| `update` | Update existing resource |
| `destroy` | Delete resource |
| `archive` | Soft-delete resource |
| `unarchive` | Restore archived resource |
| `copy` | Duplicate resource |
| `import` | Bulk import resources |
| `collection_export_xlsx` | Export list to Excel |
| `member_export_xlsx` | Export single record to Excel |

---

## How Authorization Works

### 1. User Permission Check

The `User` model provides the `access_authorized?` method:

```ruby
# app/models/user.rb
def access_authorized?(resource:, operation:)
  permissions_cache.include?([resource.to_s, operation.to_s])
end

private

def permissions_cache
  @permissions_cache ||= system_permissions
                           .pluck(:resource, :operation)
                           .to_set
end
```

**Performance:** Permissions are loaded once per request and cached as a Set for O(1) lookups. This reduces database queries from 20+ per page to just 1.

### 2. Pundit Policy Integration

The `AdminApplicationPolicy` connects Pundit to the permission system:

```ruby
# app/policies/admin_application_policy.rb
class AdminApplicationPolicy < ApplicationPolicy
  def user_access_authorized?(operation)
    user.access_authorized?(resource: record.name, operation:)
  end

  def index?
    user_access_authorized?(SystemOperations::INDEX)
  end

  def create?
    user_access_authorized?(SystemOperations::CREATE)
  end
  # ... etc
end
```

### 3. Controller Authorization

The `AdminController` automatically authorizes actions:

```ruby
# app/controllers/admin_controller.rb
class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_user!

  private

  def authorize_user!
    authorize([:admin, controller_class])
  end
end
```

---

## Setup Guide

### Initial Setup

1. **Run database migrations** (if not already done):
   ```bash
   bin/rails db:migrate
   ```

2. **Seed initial permissions**:
   ```bash
   bin/rails db:seed
   ```

   This creates:
   - "System Management" role
   - "System Managers" group
   - Permissions for all admin controllers
   - Associates permissions with the System Management role

### Creating a New User with Permissions

1. **Create the user** (via console or admin UI):
   ```ruby
   user = User.create!(
     email: "newadmin@example.com",
     password: "secure_password",
     first_name: "New",
     last_name: "Admin"
   )
   ```

2. **Add user to a group**:
   ```ruby
   system_managers = SystemGroup.find_by!(name: "System Managers")
   SystemGroupUser.create!(user: user, system_group: system_managers)
   ```

### Adding Permissions for a New Controller

When you create a new admin controller, you need to create corresponding permissions:

**Option 1: Run the maintenance task**
```bash
bin/rails maintenance_tasks:run Maintenance::EnsureModelSystemPermissionsTask
```

**Option 2: Manual creation via console**
```ruby
resource = "NewModel"  # Must match controller name

["index", "show", "new", "create", "edit", "update", "destroy"].each do |operation|
  SystemPermission.find_or_create_by!(
    resource: resource,
    operation: operation
  ) do |p|
    p.name = "#{resource} #{operation.upcase}"
  end
end
```

**Option 3: Use the bulk create maintenance task**
1. Navigate to `/admin/maintenance_tasks`
2. Run `SystemPermissionsBulkCreateTask`
3. Enter:
   - `resource_name`: Your model name (e.g., "NewModel")
   - `system_role_name`: Role to assign permissions to

---

## Admin Interface

### Managing Permissions

Navigate to the admin panel:

| Resource | URL | Purpose |
|----------|-----|---------|
| System Permissions | `/admin/system_permissions` | View/edit individual permissions |
| System Roles | `/admin/system_roles` | Manage permission groupings |
| System Groups | `/admin/system_groups` | Manage user groupings |

### Assigning Permissions

**To give a user access to a resource:**

1. Go to **Admin > System Groups**
2. Find or create the appropriate group
3. Edit the group and add the user
4. Ensure the group has the necessary roles assigned

**To add a permission to a role:**

1. Go to **Admin > System Roles**
2. Edit the role
3. Check the permissions you want to grant
4. Save

---

## Maintenance Tasks

The application includes several maintenance tasks for managing permissions:

### EnsureModelSystemPermissionsTask

**Purpose:** Scans all ActiveRecord models and creates standard CRUD permissions.

```bash
bin/rails maintenance_tasks:run Maintenance::EnsureModelSystemPermissionsTask
```

**What it does:**
- Finds all models in `app/models/`
- Creates permissions for: create, index, show, edit, update, copy
- Associates new permissions with "System Management" role
- Skips permissions that already exist

### CleanupSystemPermissionsTask

**Purpose:** Cleans up and standardizes permission records.

```bash
bin/rails maintenance_tasks:run Maintenance::CleanupSystemPermissionsTask
```

**What it does:**
- Standardizes naming (e.g., "User INDEX")
- Fixes abbreviations (e.g., "USR IDX")
- Merges duplicate resource/operation combinations
- Preserves role associations during merges
- Removes invalid records

### SystemPermissionsBulkCreateTask

**Purpose:** Creates all standard permissions for a specific resource.

```bash
# Via admin UI at /admin/maintenance_tasks
# Parameters:
#   resource_name: "YourModel"
#   system_role_name: "System Management"
```

**What it does:**
- Creates 9 permissions (archive, create, destroy, edit, index, new, show, unarchive, update)
- Associates all with the specified role

### ImportSystemPermissionsTask

**Purpose:** Bulk import permissions from an Excel spreadsheet.

```bash
bin/rails maintenance_tasks:run Maintenance::ImportSystemPermissionsTask
```

**WARNING:** This task **deletes all existing permission data** before importing!

**Spreadsheet location:** `db/source/system_permissions.xlsx`

**Required sheets:**
- `system_groups` - Group definitions
- `system_roles` - Role definitions
- `system_permissions` - Permission definitions with role assignments
- `user_assignments` - User-to-group mappings

---

## Troubleshooting

### User Can't Access a Resource

1. **Check user has a group:**
   ```ruby
   user.system_groups
   ```

2. **Check group has roles:**
   ```ruby
   user.system_groups.flat_map(&:system_roles)
   ```

3. **Check roles have the permission:**
   ```ruby
   user.system_permissions.where(resource: "ResourceName", operation: "index")
   ```

4. **Verify permission exists:**
   ```ruby
   SystemPermission.where(resource: "ResourceName", operation: "index")
   ```

### Permission Not Working After Adding

The permission cache is per-request. If testing in console, reload the user:

```ruby
user.reload
user.access_authorized?(resource: "User", operation: "index")
```

### "Pundit::NotAuthorizedError" in Production

Check the Rails logs for:
1. The resource being accessed
2. The operation being attempted
3. Verify the permission exists and is assigned to the user's role

---

## Technical Reference

### Files

**Models:**
- `app/models/user.rb` - Permission check methods
- `app/models/system_permission.rb`
- `app/models/system_role.rb`
- `app/models/system_group.rb`
- `app/models/system_group_user.rb`
- `app/models/system_group_system_role.rb`
- `app/models/system_role_system_permission.rb`

**Policies:**
- `app/policies/application_policy.rb` - Base policy
- `app/policies/admin_application_policy.rb` - Admin policy with permission checks
- `app/policies/admin/*.rb` - Resource-specific policies

**Modules:**
- `app/modules/system_operations.rb` - Operation constants

**Controllers:**
- `app/controllers/admin_controller.rb` - Base admin controller with auth
- `app/controllers/admin/system_permissions_controller.rb`
- `app/controllers/admin/system_roles_controller.rb`
- `app/controllers/admin/system_groups_controller.rb`

**Maintenance Tasks:**
- `app/tasks/maintenance/ensure_model_system_permissions_task.rb`
- `app/tasks/maintenance/cleanup_system_permissions_task.rb`
- `app/tasks/maintenance/system_permissions_bulk_create_task.rb`
- `app/tasks/maintenance/import_system_permissions_task.rb`

**Seeds:**
- `db/seeds/system_permissions.rb`
