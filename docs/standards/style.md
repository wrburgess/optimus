# MPI Style Standards

## Ruby Style

Uses **rubocop-rails-omakase** (Basecamp's opinionated Rails style guide) with these additional plugins:
- `rubocop-rspec`
- `rubocop-capybara`
- `rubocop-factory_bot`

Run `bundle exec rubocop -a` to auto-correct. All code must pass with zero offenses before committing.

### Excluded from Linting

- `config/routes.rb`
- `db/**/*` (migrations, schema, seeds)
- `node_modules/**/*`, `tmp/**/*`, `vendor/**/*`

## SCSS/CSS Style

- Bootstrap 5.3 is the base — use utility classes before writing custom CSS
- Use `@use` for imports (not deprecated `@import`)
- Two asset bundles: `admin.scss` and `public.scss`
- Custom classes use semantic names: `.table-for-show`, `.bg-custom-light-gray`
- No inline styles in ERB templates
- Icons: Bootstrap Icons with `bi bi-icon-name` classes

## JavaScript Style

- Stimulus controllers are the primary JS pattern
- No jQuery or other DOM libraries
- ES module imports (`import { Controller } from '@hotwired/stimulus'`)
- Controllers registered with kebab-case names
- Bundled via esbuild

## ERB Style

- Use ViewComponents for reusable UI elements
- Use Simple Form helpers (not raw `<form>` or `form_with`)
- Use `polymorphic_path([:admin, instance])` for URLs (not hard-coded paths)
- Use `content_tag` or components for dynamic HTML (not string interpolation)

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Models | Singular, PascalCase | `SystemGroup`, `NotificationTopic` |
| Controllers | Plural, namespaced | `Admin::SystemGroupsController` |
| Policies | Singular, namespaced | `Admin::SystemGroupPolicy` |
| Components | Namespaced directory | `Admin::TableForIndex::Component` |
| Factories | Snake_case, singular | `:system_group`, `:notification_topic` |
| Modules (enumerables) | Plural, PascalCase | `OrderStatuses`, `SystemOperations` |
| Concerns | `Has` prefix or `able` suffix | `HasDistributionMethod`, `Archivable` |
| Stimulus controllers | Kebab-case | `tom-select`, `form-validation` |
| Database tables | Plural, snake_case | `system_groups`, `notification_topics` |
| Join tables | Both names, alphabetical | `system_group_system_roles` |

## Flash Message Style

- Success: `flash[:success] = "New #{instance.class_name_title} successfully created"`
- Error: `flash[:error] = instance.errors.full_messages.to_sentence`
- Danger (delete/archive): `flash[:danger] = "#{instance.class_name_title} successfully deleted"`

Always use `class_name_title` for consistent model name display.

## Date Formatting

- Display format: `default_date_format` → "Jan 15, 2026"
- Selector format: `selector_date_format` → "2026-01-15"
- File timestamps: `file_name_with_timestamp` → "report_2026-01-15_14-30-00.xlsx"
