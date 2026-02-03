# MPI Design Standards

## UI Framework

Bootstrap 5.3 is the UI framework. Do not introduce other CSS frameworks or component libraries.

## Admin Interface Patterns

### Page Structure

Every admin page follows this layout:

```
NavBar (environment-colored: blue=dev, red=staging, gray=production)
InterfaceNotification (flash messages)
HeaderFor{Index|Show|Edit|New} (title + action buttons)
PageContainer (container-fluid with padding)
  └── Page content
```

### Index Pages

```erb
<%= render Admin::HeaderForIndex::Component.new(instance:, controller:, action:, new_button: true, collection_export_xlsx_button: true, show_filtering: true) %>
<%= render Admin::PageContainer::Component.new do %>
  <%= render Admin::TableForIndex::Component.new(data: @instances) do |table| %>
    <% table.with_column(sort_link([:admin, @q], :field, "Label")) { |instance| instance.field } %>
    <% table.with_column("Actions") do |instance| %>
      <%= render Admin::ActionButton::Component.new(operation: :show, instance:) %>
      <%= render Admin::ActionButton::Component.new(operation: :edit, instance:) %>
    <% end %>
  <% end %>
  <%= render Admin::IndexPager::Component.new(pagy: @pagy, instance: @instance) %>
  <%= render Admin::FilterCard::Component.new do %>
    <!-- Ransack filter form -->
  <% end %>
<% end %>
```

### Show Pages

Use `TableForShow` (vertical key-value layout) for the record's data, and `TableForIndex` (horizontal table) for associated records.

### Forms

See the Admin Form Patterns section in `CLAUDE.md`. Key rules:

- All selects use tom-select (`as: :tom_select`, `wrapper: :tom_select_label_inset`)
- Text/textarea inputs use `wrapper: :floating_label_form`
- Booleans use `wrapper: :custom_boolean_switch`
- Dates use `wrapper: :datepicker`
- Forms wrapped in `simple_form_for([:admin, instance])`
- Two-column layout: `row > col-12 col-lg-6`
- Cancel and Submit buttons rendered via ActionButton and FormButton components

## Component Conventions

### Creating New Components

1. Create directory: `app/components/admin/component_name/`
2. Create `component.rb` inheriting from `ApplicationComponent`
3. Create `component.html.erb` for the template
4. Add preview in `spec/components/previews/`
5. Add spec in `spec/components/`

### Component Rules

- Single responsibility — one component does one thing
- Authorization via `render?` method, not template conditionals
- Use `renders_many` / `renders_one` for slots
- All options documented via `initialize` parameters with defaults
- No business logic in templates — put it in the Ruby class

### Action Buttons

Use `Admin::ActionButton::Component` for all record actions. Operation mappings:

| Operation | HTTP Method | Icon | Color |
|-----------|------------|------|-------|
| show | GET | bi-eyeglasses | btn-info |
| edit | GET | bi-pencil | btn-warning |
| destroy | DELETE | bi-x-circle | btn-danger |
| archive | PATCH | bi-archive | btn-danger |
| unarchive | PATCH | bi-arrow-up-square-fill | btn-secondary |
| copy | POST | bi-front | btn-success |
| new | GET | bi-plus-circle | btn-success |

## Hotwire Patterns

### When to Use Turbo Frames

- Inline editing of a single record
- Loading content lazily (e.g., tab panels)
- Replacing a section of the page without full reload

### When to Use Turbo Streams

- Broadcasting updates to multiple users
- Updating multiple parts of the page from one action
- Append/prepend/replace/remove operations

### When to Use Stimulus

- Client-side interactivity that doesn't need server round-trips
- Third-party library initialization (e.g., tom-select)
- Form validation
- DOM manipulation (show/hide, toggle)

### Stimulus Controller Rules

- One concern per controller
- Register with kebab-case name: `application.register("my-controller", MyController)`
- Use targets for element references (not query selectors)
- Initialize in `connect()`, clean up in `disconnect()`
- Keep controllers in `app/javascript/admin/controllers/` or `app/javascript/public/controllers/`

## CSS Conventions

- Use Bootstrap utility classes first, custom CSS only when Bootstrap doesn't cover it
- Custom styles go in `app/assets/stylesheets/admin.scss` or `public.scss`
- Use `@use` (not `@import`) for Sass imports
- Component-specific styles use semantic class names (e.g., `.table-for-show`)
- No inline styles in templates
- Icons use Bootstrap Icons (`bi bi-icon-name`)
