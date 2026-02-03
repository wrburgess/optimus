# GitHub Copilot Instructions for Optimus

This file provides guidance for GitHub Copilot coding agents working with the Optimus repository.

## Project Overview

**Optimus** is the Ruby on Rails application template and reference implementation for the MPI Media application ecosystem. It serves as the pattern source for coding standards, architectural patterns, and development workflows across all MPI projects (avails, sfa, garden, harvest).

**Key Purpose:** Serve as a living example and template for Rails development patterns used throughout MPI Media's application suite.

## Technology Stack

### Backend
- **Ruby 4.0.1** - Primary programming language (see `.tool-versions`)
- **Rails 8.1.2** - Web framework
- **PostgreSQL 17.6** - Database
- **Puma 7.2.0** - Web server

### Frontend
- **Hotwire** (Turbo 2.0.22 + Stimulus 1.3.4) - For interactive UI without heavy JavaScript
- **Bootstrap 5.3.8** - CSS framework and component library
- **ViewComponent 4.2.0** - Component-based view architecture
- **Simple Form 5.4.1** - Form builder
- **esbuild 0.27.2** - JavaScript bundling
- **Sass 1.97.3** - CSS preprocessing

### Key Gems
- **Devise 5.0.0** - Authentication
- **Pundit 2.5.2** - Authorization
- **Good Job 4.13.1** - Background job processing
- **Ransack 4.4.1** - Search functionality
- **Pagy 43.2.8** - Pagination
- **Maintenance Tasks 2.13.0** - One-time administrative tasks
- **Lookbook 2.3.14** - Component documentation and preview

## Quick Start

### Setup
```bash
# Clone the repository
git clone https://github.com/mpimedia/optimus.git

# Install dependencies
bundle install
yarn install

# Setup database
bin/rails db:setup

# Start development server
bin/dev
```

### Common Commands
```bash
# Development
bin/dev                    # Start Rails server with asset watching
bin/rails console          # Rails console
bin/rails db:migrate       # Run migrations

# Testing
bundle exec rspec          # Run all tests
bundle exec rspec spec/models  # Run model tests only
bundle exec rspec spec/features  # Run feature tests

# Code Quality
bundle exec rubocop        # Lint code
bundle exec rubocop -a     # Auto-correct issues
bin/brakeman              # Security scan
bin/bundler-audit         # Check for vulnerable dependencies

# Assets
yarn build                # Build JavaScript/CSS
yarn watch                # Watch and rebuild assets
yarn build:css            # Build CSS only
yarn watch:css            # Watch CSS only
```

## Architecture & Patterns

### Authorization System

Optimus uses a sophisticated authorization system with:
- **Devise** for authentication
- **Pundit** for authorization policies
- **SystemPermission, SystemRole, SystemGroup** hierarchy for granular access control

**Key Models:**
```
User → SystemGroupUser → SystemGroup → SystemGroupSystemRole → SystemRole → SystemRoleSystemPermission → SystemPermission
```

**Permission Checking:**
```ruby
# In User model
user.access_authorized?(resource: "User", operation: "index")
# Returns true/false based on user's permissions through groups and roles

# In Pundit policies (app/policies/)
class UserPolicy < AdminApplicationPolicy
  def index?
    access_authorized?(resource: "User", operation: "index")
  end
end
```

**Important Files:**
- `app/models/user.rb` - Permission check methods
- `app/policies/admin_application_policy.rb` - Base policy with authorization
- `app/modules/system_operations.rb` - Operation enum definitions
- `docs/system_permissions.md` - Detailed documentation
- `docs/system_permissions_agent_guide.md` - Agent implementation guide

### View Architecture

**ViewComponent Pattern:**
Optimus heavily uses ViewComponent for reusable UI elements.

**Component Structure:**
```
app/components/admin/dashboard_card/
  ├── component.rb           # Ruby logic
  └── component.html.erb     # ERB template
```

**Example Component:**
```ruby
# app/components/admin/dashboard_card/component.rb
module Admin
  class DashboardCard::Component < ApplicationComponent
    def initialize(title:, **options)
      @title = title
      @options = options
    end
  end
end
```

**Using Components:**
```erb
<%= render Admin::DashboardCard::Component.new(title: "Users") %>
```

**Preview Components:**
- Use Lookbook for component documentation: http://localhost:3000/lookbook
- Preview files in `spec/components/previews/`

### Notification System

Sophisticated multi-channel notification architecture:

**Key Models:**
- `NotificationTopic` - What users can subscribe to
- `NotificationSubscription` - User's subscription preferences
- `NotificationTemplate` - Email/in-app templates
- `NotificationQueue` - Pending notifications
- `NotificationDistribution` - Notification delivery methods (email, in-app, etc.)
- `NotificationFrequency` - How often to send (immediate, daily, weekly)

**Background Jobs:**
- `NotifyTopicJob` - Trigger notifications for a topic
- `ProcessImmediateNotificationsJob` - Send immediate notifications
- `ProcessDailyDigestNotificationsJob` - Send daily digests
- `ProcessWeeklyDigestNotificationsJob` - Send weekly digests

**Documentation:**
- `docs/notification_system.md` - Comprehensive guide
- `docs/notification_system_agent_guide.md` - Agent implementation guide
- `docs/notification_system_implementation_kit.md` - Implementation kit

### Data Logging

**Loggable Concern:**
All models that need audit trails include the `Loggable` concern.

```ruby
class User < ApplicationRecord
  include Loggable
  # ...
end
```

This automatically logs:
- Creates (action: "create")
- Updates (action: "update") 
- Destroys (action: "destroy")

**Background Job:**
- `CreateDataLogJob` - Asynchronously creates audit log entries

### Frontend Patterns

**JavaScript (Stimulus Controllers):**
```
app/javascript/
  ├── controllers/
  │   ├── admin/           # Admin-specific controllers
  │   └── public/          # Public-facing controllers
```

**Styling (Bootstrap + Sass):**
```
app/assets/stylesheets/
  ├── admin.scss          # Admin interface styles
  ├── public.scss         # Public-facing styles
  └── components/         # Component-specific styles
```

**Turbo Frames & Streams:**
Use Hotwire patterns for dynamic updates without full page reloads.

```erb
<%= turbo_frame_tag "user_#{user.id}" do %>
  <!-- content updates via Turbo -->
<% end %>
```

## Testing Conventions

### Test Structure
```
spec/
  ├── components/        # ViewComponent tests
  ├── factories/         # FactoryBot factories
  ├── features/          # Feature/system tests (Capybara)
  ├── jobs/             # Background job tests
  ├── mailers/          # Mailer tests
  ├── models/           # Model tests
  ├── policies/         # Pundit policy tests
  └── requests/         # Controller/request tests
```

### Testing Guidelines

**Use FactoryBot (not fixtures):**
```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    email { Faker::Internet.email }
    password { "password123" }
  end
end

# In tests
let(:user) { create(:user) }
```

**Request Specs for Controllers:**
```ruby
# spec/requests/admin/users_spec.rb
RSpec.describe "Admin::Users", type: :request do
  let(:user) { create(:user) }
  
  before { sign_in user }
  
  describe "GET /admin/users" do
    it "returns success" do
      get admin_users_path
      expect(response).to have_http_status(:success)
    end
  end
end
```

**Feature Specs for UI Flows:**
```ruby
# spec/features/admin/users_spec.rb
RSpec.describe "Managing users", type: :feature do
  it "allows admin to create a user" do
    visit new_admin_user_path
    fill_in "Email", with: "test@example.com"
    click_button "Create User"
    expect(page).to have_content("User was successfully created")
  end
end
```

**Minimize Mocks and Stubs:**
Use real objects when possible for more reliable tests.

### Running Tests
```bash
# All tests
bundle exec rspec

# Specific file
bundle exec rspec spec/models/user_spec.rb

# Specific test
bundle exec rspec spec/models/user_spec.rb:42

# By type
bundle exec rspec spec/models
bundle exec rspec spec/requests
bundle exec rspec spec/features
```

## Code Quality & Linting

### Rubocop Configuration

Uses **rubocop-rails-omakase** (Basecamp's opinionated Rails style guide).

**Key Rules:**
- Inherits from `rubocop-rails-omakase`
- Excludes: routes, db, node_modules, tmp, vendor
- Additional plugins: rubocop-rspec, rubocop-capybara, rubocop-factory_bot

**Running Rubocop:**
```bash
bundle exec rubocop              # Check all files
bundle exec rubocop -a           # Auto-correct safe issues
bundle exec rubocop app/models   # Check specific directory
```

### Security Scanning

**Brakeman** - Static analysis security scanner:
```bash
bin/brakeman
```

**Bundler Audit** - Check for vulnerable dependencies:
```bash
bin/bundler-audit
```

## Development Workflow

### Branch Naming
Follow conventional patterns:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance tasks
- `docs/description` - Documentation updates

### Commit Messages
Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance
- `docs:` - Documentation
- `test:` - Testing
- `refactor:` - Code refactoring

### Code Review Checklist
- [ ] Tests pass (`bundle exec rspec`)
- [ ] Linting passes (`bundle exec rubocop`)
- [ ] Security scan passes (`bin/brakeman`)
- [ ] New features have tests
- [ ] Documentation updated if needed
- [ ] ViewComponents follow existing patterns
- [ ] Authorization checked in policies
- [ ] Database migrations are reversible

## Common Patterns

### Controllers

**Admin Controllers** inherit from `AdminController`:
```ruby
module Admin
  class UsersController < AdminController
    def index
      authorize User
      @users = policy_scope(User).page(params[:page])
    end
    
    def create
      @user = User.new(user_params)
      authorize @user
      
      if @user.save
        redirect_to admin_users_path, notice: "User created"
      else
        render :new, status: :unprocessable_entity
      end
    end
    
    private
    
    def user_params
      params.require(:user).permit(:email, :name)
    end
  end
end
```

**Key Patterns:**
- Always call `authorize` for Pundit
- Use `policy_scope` for index actions
- Use Strong Parameters
- Handle both success and failure cases
- Use Turbo-friendly redirects

### Models

**Standard Model Structure:**
```ruby
class User < ApplicationRecord
  include Loggable  # For audit trails
  
  # Devise modules
  devise :database_authenticatable, :recoverable, :rememberable, :validatable
  
  # Associations
  has_many :notification_subscriptions, dependent: :destroy
  has_many :system_group_users, dependent: :destroy
  has_many :system_groups, through: :system_group_users
  
  # Validations
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  
  # Scopes
  scope :active, -> { where(active: true) }
  scope :admins, -> { joins(:system_groups).where(system_groups: { admin: true }) }
  
  # Instance methods
  def access_authorized?(resource:, operation:)
    # Permission check logic
  end
end
```

### Forms

**Use Simple Form:**
```erb
<%= simple_form_for [:admin, @user] do |f| %>
  <%= f.input :email, required: true %>
  <%= f.input :name, required: true %>
  <%= f.input :active, as: :boolean %>
  
  <%= f.button :submit, class: "btn btn-primary" %>
<% end %>
```

### Search with Ransack

```ruby
# Controller
def index
  @q = User.ransack(params[:q])
  @users = @q.result.page(params[:page])
end

# View
<%= search_form_for [:admin, @q] do |f| %>
  <%= f.input :email_cont, label: "Email contains" %>
  <%= f.input :name_cont, label: "Name contains" %>
  <%= f.submit "Search" %>
<% end %>
```

### Background Jobs

**Using Good Job:**
```ruby
class NotifyTopicJob < ApplicationJob
  queue_as :default
  
  def perform(topic_id)
    topic = NotificationTopic.find(topic_id)
    # Job logic
  end
end

# Enqueue
NotifyTopicJob.perform_later(topic.id)
```

## Common Gotchas & Tips

### 1. Authorization Required
**Always** include authorization in admin controllers:
```ruby
def index
  authorize Model  # Required!
  # ...
end
```

### 2. Agent Configuration
Agent configuration files live in `.claude/` (Claude Code), `.github/copilot-instructions.md` (Copilot), and `CLAUDE.md`. Architecture documentation is in `docs/architecture/`.

### 3. Asset Pipeline
Assets are in `app/assets/builds/` (gitignored). Run `yarn build` before testing:
```bash
yarn build        # Build once
yarn watch        # Watch for changes
```

### 4. Database Seeds
Run seeds for development data:
```bash
bin/rails db:seed
```

### 5. ViewComponent Previews
Test components in isolation via Lookbook:
```
http://localhost:3000/lookbook
```

### 6. Permission System
Always check the current user's permissions before displaying admin features:
```ruby
# In controllers
authorize resource

# In views
<% if policy(resource).show? %>
  <%= link_to "View", resource %>
<% end %>
```

### 7. Turbo Frame Responses
Return turbo-compatible responses:
```ruby
respond_to do |format|
  format.html { redirect_to path, notice: "Success" }
  format.turbo_stream  # For Turbo updates
end
```

### 8. Background Job Testing
Test jobs synchronously in tests:
```ruby
# spec/rails_helper.rb includes:
config.active_job.queue_adapter = :test

# In tests
expect {
  NotifyTopicJob.perform_later(topic.id)
}.to have_enqueued_job(NotifyTopicJob)

# Or perform inline
perform_enqueued_jobs do
  NotifyTopicJob.perform_later(topic.id)
end
```

## Documentation Resources

### In-Repo Documentation
- `README.md` - Project overview and setup
- `CLAUDE.md` - AI assistant guidance (Claude Code specific)
- `AGENTS.md` - Testing framework and development defaults
- `docs/system_permissions.md` - Authorization system
- `docs/system_permissions_agent_guide.md` - Agent guide for permissions
- `docs/notification_system.md` - Notification system
- `docs/notification_system_agent_guide.md` - Agent guide for notifications
- `docs/credentials_management.md` - Managing credentials
- `docs/dependency_management.md` - Dependency updates
- `docs/asset_pipeline.md` - Frontend asset management

### External Documentation
When working on specific gems/libraries, reference:
- Rails 8.1 Guides: https://guides.rubyonrails.org
- Ruby 4.0 Docs: https://ruby-doc.org
- Bootstrap 5.3: https://getbootstrap.com/docs/5.3
- Hotwire/Turbo: https://turbo.hotwired.dev
- Stimulus: https://stimulus.hotwired.dev
- ViewComponent: https://viewcomponent.org
- Pundit: https://github.com/varvet/pundit
- Devise: https://github.com/heartcombo/devise
- Good Job: https://github.com/bensheldon/good_job
- Simple Form: https://github.com/heartcombo/simple_form

### Context7 MCP Integration
If Context7 MCP is configured (`.mcp.json`), prefer querying documentation via MCP:
- `/websites/guides_rubyonrails_v8_0` - Rails docs
- `/websites/ruby-lang_en` - Ruby docs
- `/websites/postgresql_17` - PostgreSQL docs
- `/hotwired/turbo-rails` - Turbo docs
- `/viewcomponent/view_component` - ViewComponent docs
- See `AGENTS.md` for complete library list

## Related Repositories

This is the template repository for the MPI Media ecosystem:
- **avails** - Central data repository
- **sfa** - Video clip hosting and search
- **garden** - Static site generator
- **harvest** - Public-facing ecommerce platform

**Cross-repo context:** See `.claude/projects.json` for GitHub URLs. Create `.claude/projects.local.json` (gitignored) with local paths for faster cross-repo operations.

## Deployment

### Production
Uses Kamal for containerized deployment:
```bash
bin/kamal deploy
```

### Environment Variables
Managed via Rails credentials:
```bash
bin/rails credentials:edit --environment production
```

See `docs/credentials_management.md` for details.

## Getting Help

1. **Check existing documentation** in `/docs` directory
2. **Review similar patterns** in the codebase (this is a template repo)
3. **Check related repos** (avails, sfa) for examples
4. **Run tests** to validate changes
5. **Use Lookbook** to preview components: http://localhost:3000/lookbook

## Version Information

Last updated: 2026-01-29

**Current Versions:**
- Ruby: 4.0.1
- Rails: 8.1.2
- Node: 25.4.0
- PostgreSQL: 17.6
- Yarn: 4.12.0

See `.tool-versions`, `Gemfile`, and `package.json` for exact dependency versions.
