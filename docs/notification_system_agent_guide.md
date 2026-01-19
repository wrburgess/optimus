# Notification System - Agent Implementation Guide

## Purpose

This guide is for AI agents implementing new notifications in the Optimus codebase. Follow these steps to add notifications to controller actions or model callbacks.

---

## Quick Reference

### Triggering a Notification

```ruby
# From any model that includes Notifiable
instance.notify_topic("topic.key", context: { var1: value1, var2: value2 })

# Or directly using the job
NotifyTopicJob.perform_later(
  topic_key: "topic.key",
  context: Notifiable.serialize_context({ var1: value1, var2: value2 })
)
```

### Required Components

1. **NotificationTopic** - Must exist with matching `key`
2. **NotificationTemplate** - Must exist for the topic + distribution_method
3. **NotificationSubscription** - Users must be subscribed to receive notifications

---

## Step-by-Step: Adding a New Notification

### Step 1: Define the Topic Key

Choose a descriptive, namespaced key following the pattern `resource.action`:

```
order.created
order.shipped
order.cancelled
invoice.generated
report.completed
```

### Step 2: Add to Seeds

Create or update a seed file at `db/seeds/notification_topics.rb`:

```ruby
# Example: Adding order notifications
order_topics = [
  {
    key: "order.created",
    name: "Order Created",
    description: "Notification sent when a new order is placed",
    template: {
      subject_template: "New Order #<%= order.id %> from <%= customer.full_name %>",
      body_template: <<~ERB
        A new order has been placed:

        Order ID: <%= order.id %>
        Customer: <%= customer.full_name %>
        Total: <%= number_to_currency(order.total) %>
        <% if created_by %>
        Placed by: <%= created_by.full_name %>
        <% end %>
      ERB
    }
  },
  {
    key: "order.shipped",
    name: "Order Shipped",
    description: "Notification sent when an order is shipped",
    template: {
      subject_template: "Order #<%= order.id %> Has Shipped",
      body_template: <<~ERB
        Order #<%= order.id %> has been shipped!

        Tracking Number: <%= tracking_number %>
        Carrier: <%= carrier %>
        Estimated Delivery: <%= estimated_delivery %>
      ERB
    }
  }
]

order_topics.each do |topic_data|
  topic = NotificationTopic.find_or_create_by!(key: topic_data[:key]) do |t|
    t.name = topic_data[:name]
    t.description = topic_data[:description]
  end

  if topic_data[:template]
    NotificationTemplate.find_or_create_by!(
      notification_topic: topic,
      distribution_method: "email"
    ) do |template|
      template.subject_template = topic_data[:template][:subject_template]
      template.body_template = topic_data[:template][:body_template]
      template.active = true
    end
  end
end
```

### Step 3: Add Notification Trigger to Controller

```ruby
class Admin::OrdersController < AdminController
  def create
    @order = Order.create(order_params)

    if @order.persisted?
      @order.log(user: current_user, operation: action_name)

      # Trigger notification
      @order.notify_topic("order.created",
        context: {
          order: @order,
          customer: @order.customer,
          created_by: current_user
        }
      )

      flash[:success] = "Order created"
      redirect_to [:admin, @order]
    else
      render :new
    end
  end

  def ship
    @order = Order.find(params[:id])
    @order.update(status: "shipped", shipped_at: Time.current)

    @order.log(user: current_user, operation: action_name)

    # Trigger notification with shipping details
    @order.notify_topic("order.shipped",
      context: {
        order: @order,
        tracking_number: params[:tracking_number],
        carrier: params[:carrier],
        estimated_delivery: params[:estimated_delivery]
      }
    )

    flash[:success] = "Order marked as shipped"
    redirect_to [:admin, @order]
  end
end
```

### Step 4: Ensure Model Includes Notifiable

```ruby
class Order < ApplicationRecord
  include Notifiable  # Add this line
  include Loggable
  include Archivable

  belongs_to :customer
  # ...
end
```

### Step 5: Run Seeds

```bash
bundle exec rails db:seed
```

Or run just the notification seeds:
```bash
bundle exec rails runner "require_relative 'db/seeds/notification_topics'"
```

---

## Template Variable Reference

### Passing Context

The `context` hash accepts:

| Type | Serialization | Example |
|------|---------------|---------|
| ActiveRecord model | Auto-serialized by ID | `order: @order` |
| String | Direct | `status: "shipped"` |
| Number | Direct | `amount: 99.99` |
| Time/DateTime | Direct | `shipped_at: Time.current` |
| Boolean | Direct | `expedited: true` |
| Array | JSON | `items: ["A", "B"]` |
| Hash | JSON | `metadata: { key: "value" }` |

### Accessing in Templates

All context keys become local variables:

```erb
<%# Context: { order: @order, status: "shipped", amount: 99.99 } %>

Order: <%= order.id %>
Status: <%= status %>
Amount: <%= amount %>
```

### Conditional Content

```erb
<% if expedited %>
This is an expedited order!
<% end %>

<% if tracking_number.present? %>
Tracking: <%= tracking_number %>
<% else %>
Tracking information will be provided soon.
<% end %>
```

### Iterating Collections

```erb
<% items.each do |item| %>
- <%= item.name %>: <%= item.quantity %> x <%= item.price %>
<% end %>
```

---

## Common Patterns

### Pattern 1: CRUD Notifications

```ruby
# In controller
def create
  @instance = Model.create(params)
  @instance.notify_topic("model.created", context: { model: @instance, created_by: current_user })
end

def update
  @instance = Model.find(params[:id])
  @instance.update(params)
  @instance.notify_topic("model.updated", context: { model: @instance, updated_by: current_user })
end

def destroy
  @instance = Model.find(params[:id])
  @instance.archive
  @instance.notify_topic("model.archived", context: { model: @instance, archived_by: current_user })
end
```

### Pattern 2: Status Change Notifications

```ruby
def approve
  @request = Request.find(params[:id])
  @request.update(status: "approved", approved_at: Time.current, approved_by: current_user)

  @request.notify_topic("request.approved",
    context: {
      request: @request,
      approved_by: current_user,
      approval_notes: params[:notes]
    }
  )
end

def reject
  @request = Request.find(params[:id])
  @request.update(status: "rejected", rejected_at: Time.current, rejected_by: current_user)

  @request.notify_topic("request.rejected",
    context: {
      request: @request,
      rejected_by: current_user,
      rejection_reason: params[:reason]
    }
  )
end
```

### Pattern 3: Background Job Notifications

```ruby
class GenerateReportJob < ApplicationJob
  def perform(report_id, user_id)
    report = Report.find(report_id)
    user = User.find(user_id)

    # Generate report...
    report.update(status: "completed", completed_at: Time.current)

    # Notify when complete
    report.notify_topic("report.completed",
      context: {
        report: report,
        requested_by: user,
        download_url: report.download_url
      }
    )
  end
end
```

### Pattern 4: Model Callback Notifications

```ruby
class Payment < ApplicationRecord
  include Notifiable

  after_commit :notify_payment_received, on: :create

  private

  def notify_payment_received
    notify_topic("payment.received",
      context: {
        payment: self,
        invoice: invoice,
        customer: invoice.customer
      }
    )
  end
end
```

---

## Testing Notifications

### Unit Test for Notification Trigger

```ruby
# spec/requests/admin/orders_spec.rb
describe "POST /admin/orders" do
  it "enqueues notification job on create" do
    expect {
      post admin_orders_path, params: { order: valid_params }
    }.to have_enqueued_job(NotifyTopicJob).with(
      topic_key: "order.created",
      context: hash_including("order" => hash_including("_class" => "Order"))
    )
  end
end
```

### Integration Test for Full Flow

```ruby
# spec/features/order_notification_spec.rb
describe "Order notification flow" do
  let!(:topic) { create(:notification_topic, key: "order.created") }
  let!(:template) { create(:notification_template, notification_topic: topic, distribution_method: "email") }
  let!(:subscription) { create(:notification_subscription, notification_topic: topic, user: admin, distribution_frequency: "immediate") }

  it "sends email when order is created" do
    perform_enqueued_jobs do
      post admin_orders_path, params: { order: valid_params }
    end

    expect(ActionMailer::Base.deliveries.count).to eq(1)
    expect(NotificationMessage.last.subject).to include("New Order")
  end
end
```

---

## Checklist for Adding Notifications

- [ ] Choose topic key following `resource.action` pattern
- [ ] Add topic and template to seeds file
- [ ] Ensure model includes `Notifiable` concern
- [ ] Add `notify_topic` call in controller action
- [ ] Pass all required context variables
- [ ] Run `rails db:seed` to create topic/template
- [ ] Create subscriptions for users who should receive notifications
- [ ] Write tests for notification trigger
- [ ] Test end-to-end with real subscription

---

## File Locations Reference

| Component | Path |
|-----------|------|
| Notifiable concern | `app/models/concerns/notifiable.rb` |
| Template renderer | `app/models/concerns/notification_template_renderer.rb` |
| Main job | `app/jobs/notify_topic_job.rb` |
| Topic seeds | `db/seeds/notification_topics.rb` |
| Topic model | `app/models/notification_topic.rb` |
| Template model | `app/models/notification_template.rb` |
| Subscription model | `app/models/notification_subscription.rb` |

---

## Error Handling

### Topic Not Found

If `notify_topic` is called with a non-existent topic key, `NotifyTopicJob` will raise `ActiveRecord::RecordNotFound`. Ensure the topic exists in seeds.

### Template Render Errors

If a template references an undefined variable, `NotificationTemplateRenderer::TemplateRenderError` is raised. Always pass all variables used in templates.

### No Subscriptions

If no active subscriptions exist for a topic, `NotifyTopicJob` completes successfully but creates no messages or queue items. This is normal behavior.
