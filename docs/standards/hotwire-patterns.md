# MPI Hotwire Patterns

## Overview

Optimus uses Hotwire (Turbo + Stimulus) for progressive enhancement of server-rendered HTML. The default approach is **conservative**: Turbo Drive for navigation, Stimulus for interactive behavior, and Turbo Frames/Streams only when they provide clear UX benefit over a full page load.

## When to Use Each Tool

| Tool | Use When | Example |
|------|----------|---------|
| **Turbo Drive** | Default page navigation | Every link and form submission (automatic) |
| **Turbo Frames** | Updating a region of the page without a full reload | Inline editing, lazy-loaded panels, tabbed content |
| **Turbo Streams** | Updating multiple regions or broadcasting real-time changes | Chat messages, notifications, live dashboards |
| **Turbo Morphing** | Full-page refresh that preserves scroll/form state | After form submission on the same page |
| **Stimulus** | Client-side behavior on existing DOM elements | Dropdowns, form validation, toggles, clipboard copy |
| **Full page load** | File downloads, external redirects, third-party auth | XLSX exports, OAuth callbacks |

**Decision rule:** Start with Turbo Drive (the default). Add Frames when you need partial page updates. Add Streams when you need multi-region or real-time updates. Add Stimulus when you need client-side interactivity that HTML alone can't provide.

## Turbo Drive (Default)

Turbo Drive is enabled globally by importing `@hotwired/turbo-rails`. Every `<a>` click and `<form>` submission is intercepted and performed via fetch, replacing the `<body>` without a full page reload.

**No code needed** — it works automatically. Opt out for specific links when necessary:

```erb
<%# Disable Turbo for file downloads %>
<%= link_to "Export XLSX", export_path, data: { turbo: false } %>

<%# Specify HTTP method %>
<%= link_to "Archive", archive_path, data: { turbo_method: :patch } %>
```

### Asset Tracking

Stylesheets use `data-turbo-track="reload"` to force a full page reload when assets change (e.g., after deployment):

```erb
<%= stylesheet_link_tag :admin, "data-turbo-track": "reload" %>
```

## Turbo Frames

Use Turbo Frames to replace a portion of the page without a full reload.

### Basic Frame

```erb
<%# In the parent page %>
<%= turbo_frame_tag "user_details" do %>
  <p><%= @user.name %></p>
  <%= link_to "Edit", edit_admin_user_path(@user) %>
<% end %>

<%# In the edit page — matching frame ID %>
<%= turbo_frame_tag "user_details" do %>
  <%= render "form", user: @user %>
<% end %>
```

Clicking "Edit" replaces only the frame content, not the entire page.

### Lazy-Loading Frame

Use `src` and `loading: "lazy"` to defer content loading until the frame enters the viewport:

```erb
<%= turbo_frame_tag "activity_log", src: admin_activity_path, loading: "lazy" do %>
  <p>Loading activity...</p>
<% end %>
```

Use this pattern for:
- Dashboard panels that load independently
- Show page tabs with heavy content
- Below-the-fold content

### Frame Navigation

By default, links inside a frame navigate within that frame. To break out:

```erb
<%# Navigate the entire page (break out of frame) %>
<%= link_to "View All", admin_users_path, data: { turbo_frame: "_top" } %>

<%# Target a different frame %>
<%= link_to "Details", admin_user_path(user), data: { turbo_frame: "sidebar" } %>
```

### When NOT to Use Frames

- **Simple CRUD forms** — redirect after submit is fine; frames add complexity without benefit
- **Full-page layouts** — if the header, sidebar, and content all change, use Turbo Drive
- **SEO-sensitive pages** — frames can complicate crawling

## Turbo Streams

Use Turbo Streams to update multiple DOM elements from a single response, or to broadcast real-time changes via Action Cable.

### Stream Response from Controller

```ruby
# app/controllers/admin/comments_controller.rb
def create
  @comment = @post.comments.create!(comment_params)

  respond_to do |format|
    format.turbo_stream  # renders create.turbo_stream.erb
    format.html { redirect_to admin_post_path(@post) }
  end
end
```

```erb
<%# app/views/admin/comments/create.turbo_stream.erb %>
<%= turbo_stream.append "comments" do %>
  <%= render partial: "admin/comments/comment", locals: { comment: @comment } %>
<% end %>

<%= turbo_stream.update "comment_count", @post.comments.count.to_s %>
<%= turbo_stream.replace "comment_form" do %>
  <%= render "admin/comments/form", post: @post, comment: Comment.new %>
<% end %>
```

### Available Stream Actions

| Action | Effect |
|--------|--------|
| `append` | Add to end of container |
| `prepend` | Add to beginning of container |
| `replace` | Replace entire element (including the target tag) |
| `update` | Replace contents of element (keep the target tag) |
| `remove` | Remove element from DOM |
| `before` | Insert before the target element |
| `after` | Insert after the target element |
| `refresh` | Trigger a Turbo Drive page refresh (Rails 8+) |

### Broadcasting (Real-Time Updates)

Use Action Cable broadcasts for live updates across all connected clients:

```ruby
# app/models/notification_message.rb
after_create_commit -> {
  broadcast_prepend_to "notifications",
    target: "notification_list",
    partial: "admin/notifications/notification",
    locals: { notification: self }
}
```

```erb
<%# In the view — subscribe to the stream %>
<%= turbo_stream_from "notifications" %>
<div id="notification_list">
  <%= render @notifications %>
</div>
```

### When NOT to Use Streams

- **Single-element updates** — use a Turbo Frame instead (simpler)
- **Non-HTML responses** — Streams only work with HTML fragments
- **Heavy real-time data** — consider WebSockets directly for high-frequency updates (e.g., live charts)

## Turbo Morphing (Rails 8+)

Turbo 8 introduced page refresh with morphing, which diffs the current DOM against the new response and applies minimal changes, preserving scroll position, form state, and focus.

### Enable Morphing

```erb
<%# In the layout or specific page %>
<%= turbo_refreshes_with method: :morph, scroll: :preserve %>
```

### Broadcast a Refresh

Instead of broadcasting individual stream actions, broadcast a page refresh:

```ruby
# app/models/comment.rb
after_create_commit -> { broadcast_refresh_to "post_#{post_id}" }
```

```erb
<%= turbo_stream_from "post_#{@post.id}" %>
```

This causes all connected clients to re-fetch the page and morph the differences.

### When to Use Morphing

- Forms that stay on the same page after submission
- Pages with many independent components that all need updating
- When broadcasting partial updates would require too many stream actions

### When NOT to Use Morphing

- Pages with significant client-side state (un-saved form data, open modals)
- When you need fine-grained control over which elements update

## Stimulus Controllers

Stimulus controllers add behavior to existing HTML elements. They do NOT render HTML.

### Controller Structure

```javascript
// app/javascript/admin/controllers/clipboard_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["source"]
  static values = { successMessage: { type: String, default: "Copied!" } }

  copy() {
    navigator.clipboard.writeText(this.sourceTarget.value)
    // Show feedback
  }
}
```

### Connecting Controllers

```erb
<div data-controller="clipboard">
  <input data-clipboard-target="source" value="<%= @api_key %>" readonly>
  <button data-action="click->clipboard#copy">Copy</button>
</div>
```

### Existing Controllers

| Controller | Location | Purpose |
|-----------|----------|---------|
| `tom-select` | `admin/controllers/tom_select_controller.js` | Enhanced select inputs with search, multi-select, tag creation |
| `form-validation` | `admin/controllers/form_validation_controller.js` | HTML5 form validation with Bootstrap styling |

### Controller Conventions

- **One controller per behavior** — don't combine clipboard, toggle, and modal into one controller
- **Use targets** for DOM references instead of `querySelector`
- **Use values** for configuration instead of `data-*` attributes
- **Use actions** for event binding instead of `addEventListener`
- **Keep controllers small** — under 50 lines. Extract shared logic into utility modules if needed
- **Register in the index file** — `app/javascript/admin/controllers/index.js` or `app/javascript/public/controllers/index.js`

### Stimulus with Turbo

When Turbo replaces DOM content, Stimulus controllers automatically `disconnect` from removed elements and `connect` to new ones. No manual cleanup needed.

**Gotcha:** If you store state in a controller, it resets when Turbo navigates. Use `values` backed by `data-*` attributes to persist state in the DOM.

## Form Patterns

### Standard Admin Form

```erb
<%= simple_form_for([:admin, @instance],
  html: { novalidate: true },
  data: {
    controller: "form-validation",
    action: "submit->form-validation#submit"
  }) do |f| %>

  <%= f.input :name, wrapper: :floating_label_form, input_html: { required: true } %>

  <%= f.input :notification_topic_id,
      as: :tom_select,
      collection: NotificationTopic.options_for_select,
      label: "Notification topic",
      prompt: "Select a notification topic...",
      autocomplete: "off",
      wrapper: :tom_select_label_inset %>

  <%= f.button :submit, class: "btn btn-primary" %>
<% end %>
```

### Form Submission Flow

1. User submits form → Turbo intercepts the POST/PATCH
2. Controller processes the request
3. **Success:** `redirect_to` with flash → Turbo Drive navigates to the new page
4. **Validation error:** Re-render the form with `status: :unprocessable_entity` → Turbo replaces the page

```ruby
def create
  @instance = Model.new(model_params)
  if @instance.save
    redirect_to admin_model_path(@instance), flash: { success: "Created." }
  else
    render :new, status: :unprocessable_entity
  end
end
```

The `status: :unprocessable_entity` (422) marks this as a validation failure, so Turbo doesn't treat it as a successful non-GET submission that must redirect and instead renders the response body (the form with errors).

### Disabling Turbo for Specific Forms

```erb
<%= simple_form_for(@resource, data: { turbo: false }) do |f| %>
  <%# Standard form submission without Turbo %>
<% end %>
```

Use this for file uploads that need progress indicators or forms that submit to external services.

## Common Anti-Patterns

### Avoid: JavaScript-rendered HTML

```javascript
// BAD — rendering HTML in JavaScript
this.element.innerHTML = `<div class="card">${data.name}</div>`
```

```ruby
# GOOD — return HTML from server via Turbo Stream
turbo_stream.update "container", partial: "card", locals: { name: data.name }
```

### Avoid: Stimulus controllers that fetch and render

```javascript
// BAD — Stimulus controller acting as a mini-framework
async connect() {
  const response = await fetch("/api/data")
  const data = await response.json()
  this.element.innerHTML = this.renderTemplate(data)
}
```

```erb
<%# GOOD — use a lazy-loaded Turbo Frame %>
<%= turbo_frame_tag "data_panel", src: data_path, loading: "lazy" do %>
  <p>Loading...</p>
<% end %>
```

### Avoid: Over-using Turbo Streams

```ruby
# BAD — using streams for simple navigation
respond_to do |format|
  format.turbo_stream { redirect_to admin_users_path }
end
```

```ruby
# GOOD — just redirect (Turbo Drive handles it)
redirect_to admin_users_path, flash: { success: "Saved." }
```

### Avoid: Global Stimulus state

```javascript
// BAD — storing state in module-level variables
let globalCounter = 0

export default class extends Controller {
  increment() { globalCounter++ }
}
```

```javascript
// GOOD — use Stimulus values (persisted in DOM)
export default class extends Controller {
  static values = { counter: { type: Number, default: 0 } }

  increment() { this.counterValue++ }
}
```

## Reference

- [Turbo Handbook](https://turbo.hotwired.dev/handbook/introduction)
- [Stimulus Handbook](https://stimulus.hotwired.dev/handbook/introduction)
- [Turbo Rails gem](https://github.com/hotwired/turbo-rails)
- [Hotwire discussion forum](https://discuss.hotwired.dev/)
