## Rails Documentation Stack (Context7)

- Always use Context7 MCP when we need library/API documentation, code generation, setup or configuration steps without anyone having to explicitly ask.

## Guidelines

- MCP Reference: Use `Context7 Library ID` for referencing the Context7 MCP and fallback to general knowledge last.
- Version pinning: If a library specifies a version, use the stated minor (e.g., Rails 8.1.1) and stay on the latest patch within that minor.

### Testing guidance

- RSpec is required.
- Use FactoryBot for factories.
- Minimize use of mocks and stubs.
- Use request specs for controllers.
- Use Capybara-driven system specs for UI flows.
- Run `bundle exec rspec` to run tests.

### Frontend stack note

- All styling should utilize Bootstrap tools, conventions, and patterns for CSS needs.
- Default to Hotwire (Turbo + Stimulus) for interactivity.
- Default to Simple Form for form helpers.
- Avoid any use of JavaScript frameworks other than Hotwire + Stimulus + Turbo.

### AuthZ/AuthN defaults

- Use Devise for auth and Pundit for authorization with a reminder to check their docs when touching auth-related code.
- We use a more specific SystemPermission, SystemRole, SystemGroup, Account, User model hierarchy with Pundit for AuthZ.

### Linting/formatting

- Check your work to follow any Rubocop linting rules as inherited or specified in `/.rubocop.yml`.
- Run `bundle exec rubocop` in the terminal to check for linting issues.
- Autocorrect when necessary.

## Referenced Projects

- `/wrburgess/optimus` - for patterns, examples, and conventions for features and projects
- `/basecamp/fizzy` - if no patterns or examples exist in optimus and you need inspiration

## MCP Query Strategy

- MCP example: Query `/websites/guides_rubyonrails_v8_0` for Rails docs; use the same pattern for other Library IDs; fall back to general knowledge only if absent.
- Always check the Rails and then Ruby docs first.
- Query additional libraries based on the topic.

## Core Libraries (Query in Priority Order)

- Note: Items below refer to the Context7 Library ID and Library Description

1. `/websites/guides_rubyonrails_v8_0` - Rails 8.1.1 framework documentation
1. `/websites/ruby-lang_en` - Ruby language documentation
1. `/websites/postgresql_17` - PostgreSQL 17.6 documentation
1. `/hotwired/turbo-rails` - Turbo/Hotwire
1. `/hotwired/stimulus-rails` - Stimulus JS documentation
1. `/websites/getbootstrap_5_3` - Bootstrap 5.3 documentation
1. `/rspec/rspec-rails` - Testing documentation
1. `/rails/rails` - Ruby on Rails framework
1. `/ruby/ruby` - Ruby language repo
1. `/postgres/postgres` - PostgreSQL database repo
1. `/viewcomponent/view_component` - Rails erb components repo
1. `/rubocop/rubocop` - Linting documentation
1. `/rails/propshaft` - Asset Pipeline management

## Additional Libraries (Query as Needed)

- `/websites/betterspecs` - Testing recommendations and tips
- `/heartcombo/devise` - Authentication
- `/varvet/pundit` - Authorization
- `/heartcombo/simple_form` - Form builder
- `/faker-ruby/faker` - Faker gem documentation
- `/bensheldon/good_job` - Async job management
- `/caxlsx/caxlsx` - Excel document library
- `/shopify/maintenance_tasks` - Maintenance Task library
- `/activerecord-hackery/ransack` - Search enhancement library
- `/websites/stripe` - Payments library
- `/thoughtbot/factory_bot_rails` - Factory management for specs
- `/teamcapybara/capybara` - Browser based testing library
- `/puma/puma` - Web server library
