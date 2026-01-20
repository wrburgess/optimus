# Notification System Documentation

## Overview

The Optimus Notification System is a custom Topic/Subscriber pattern implementation inspired by AWS SNS. It allows the application to send notifications to users through multiple channels (email, SMS, chat) with flexible delivery scheduling (immediate, hourly summaries, daily summaries).

## Architecture

### Core Concepts

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ NotificationTopic│────▶│ NotificationTemplate │     │ NotificationSubscription│
│ (e.g., user.created)│  │ (ERB templates)      │     │ (user + topic + prefs)  │
└─────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                                                    │
         │                                                    │
         ▼                                                    ▼
┌─────────────────────┐                           ┌─────────────────────┐
│ NotificationMessage │◀──────────────────────────│ NotificationQueueItem│
│ (rendered content)  │                           │ (delivery scheduling) │
└─────────────────────┘                           └─────────────────────┘
```

### Data Models

#### NotificationTopic
Defines a type of notification event (e.g., "user.created", "user.password_changed").

| Field | Type | Description |
|-------|------|-------------|
| name | string | Human-readable name (e.g., "User Created") |
| key | string | Unique identifier used in code (e.g., "user.created") |
| description | text | Optional description of the notification |
| archived_at | datetime | Soft delete timestamp |

#### NotificationTemplate
Defines how a notification is rendered for a specific delivery channel.

| Field | Type | Description |
|-------|------|-------------|
| notification_topic_id | bigint | FK to topic |
| distribution_method | string | "email", "sms", or "chat" |
| subject_template | string | ERB template for subject line |
| body_template | text | ERB template for message body |
| active | boolean | Whether template is active |

**Display Name**: "Topic Name (Method)" - e.g., "User Password Changed (Email)"

**ERB Template Variables**: Templates have access to any variables passed in the `context` hash when triggering the notification.

Example template:
```erb
Subject: Password Changed for <%= user.full_name %>
Body: Hello, your password was changed<% if changed_by %> by <%= changed_by.full_name %><% end %>.
```

#### NotificationSubscription
Links a user to a topic with their delivery preferences.

| Field | Type | Description |
|-------|------|-------------|
| notification_topic_id | bigint | FK to topic |
| user_id | bigint | FK to user |
| distribution_method | string | "email", "sms", or "chat" |
| distribution_frequency | string | "immediate", "summarized_hourly", "summarized_daily" |
| summarized_daily_hour | integer | Hour (0-23) for daily summaries |
| active | boolean | Whether subscription is active |

**Display Name**: "Topic Name - User Name" - e.g., "User Password Changed - John Smith"

#### NotificationMessage
Stores a rendered notification message.

| Field | Type | Description |
|-------|------|-------------|
| notification_topic_id | bigint | FK to topic |
| subject | string | Rendered subject |
| body | text | Rendered body |
| metadata | jsonb | Original context data |

**Display Name**: Truncated subject (50 chars) - e.g., "Password Changed for John Smith"

#### NotificationQueueItem
Tracks delivery status for each subscription.

| Field | Type | Description |
|-------|------|-------------|
| notification_subscription_id | bigint | FK to subscription |
| notification_message_id | bigint | FK to message |
| user_id | bigint | FK to user (denormalized) |
| distribution_method | string | Delivery channel |
| distribute_at | datetime | When to send |
| distributed_at | datetime | When actually sent (null = pending) |

**Display Name**: "User Name - Subject" (truncated to 30 chars) - e.g., "John Smith - Password Changed for..."

---

## Delivery Frequencies

### Immediate
Notifications are sent as soon as the event occurs.

### Summarized Hourly
Notifications are batched and sent at the top of each hour. Multiple notifications within the hour are combined into a single summary email.

### Summarized Daily
Notifications are batched and sent once per day at the user's preferred hour (in their timezone). The `summarized_daily_hour` field controls when (0-23).

---

## Job Pipeline

```
[Event Triggered]
      │
      ▼
NotifyTopicJob
  - Finds topic by key
  - Renders templates
  - Creates NotificationMessage
  - Creates NotificationQueueItem for each active subscription
  - Enqueues ProcessImmediateNotificationsJob
      │
      ├──▶ ProcessImmediateNotificationsJob (runs immediately)
      │       └──▶ DistributeNotificationJob (per item)
      │
      └──▶ ProcessSummarizedNotificationsJob (GoodJob cron, hourly)
              └──▶ DistributeSummarizedNotificationsJob (per user/method group)
```

---

## Admin Interface

### Accessing Notification Management

Navigate to the admin panel. The notification resources are available at:

- `/admin/notification_topics` - Manage notification types
- `/admin/notification_templates` - Manage email/SMS/chat templates
- `/admin/notification_subscriptions` - Manage user subscriptions
- `/admin/notification_messages` - View sent messages (read-only)
- `/admin/notification_queue_items` - View delivery queue (read-only)

### Creating a New Notification Topic

1. Go to **Admin > Notification Topics**
2. Click **New**
3. Fill in:
   - **Name**: Human-readable name (e.g., "Order Shipped")
   - **Key**: Code identifier (e.g., "order.shipped")
   - **Description**: Optional explanation
4. Click **Submit**

### Creating a Template

1. Go to **Admin > Notification Templates**
2. Click **New**
3. Fill in:
   - **Topic**: Select the notification topic
   - **Distribution Method**: Email, SMS, or Chat
   - **Subject Template**: ERB template for subject
   - **Body Template**: ERB template for body
   - **Active**: Check to enable
4. Click **Submit**

**Template Syntax**: Use ERB tags to insert dynamic content:
- `<%= variable %>` - Output a value
- `<% if condition %>...<% end %>` - Conditional content
- `<% items.each do |item| %>...<% end %>` - Loops

### Managing Subscriptions

1. Go to **Admin > Notification Subscriptions**
2. Click **New**
3. Fill in:
   - **Topic**: Select the notification topic
   - **User**: Select the user to subscribe
   - **Distribution Method**: How to deliver
   - **Distribution Frequency**: When to deliver
   - **Daily Summary Hour**: If using daily summaries
   - **Active**: Check to enable
4. Click **Submit**

### Monitoring

- **Notification Messages**: View all rendered messages with their content and metadata
- **Notification Queue Items**: View delivery status (pending vs. sent), scheduled times, and actual delivery times

---

## Implementation Guide

### Adding Notifications to a Controller

#### Step 1: Include the Notifiable Concern

The `Notifiable` concern is already included in the `User` model. For other models, add:

```ruby
class MyModel < ApplicationRecord
  include Notifiable
  # ...
end
```

Or call directly from a controller:

```ruby
class Admin::MyController < AdminController
  include Notifiable  # if needed at controller level

  def create
    @instance = MyModel.create(create_params)

    # Trigger notification
    @instance.notify_topic("my_model.created",
      context: {
        my_model: @instance,
        created_by: current_user
      }
    )

    redirect_to @instance
  end
end
```

#### Step 2: Create the Topic (via seeds or admin)

```ruby
# db/seeds/my_notifications.rb
NotificationTopic.find_or_create_by!(key: "my_model.created") do |t|
  t.name = "My Model Created"
  t.description = "Sent when a new MyModel is created"
end
```

#### Step 3: Create the Template (via seeds or admin)

```ruby
topic = NotificationTopic.find_by!(key: "my_model.created")

NotificationTemplate.find_or_create_by!(
  notification_topic: topic,
  distribution_method: "email"
) do |template|
  template.subject_template = "New <%= my_model.class.name %>: <%= my_model.name %>"
  template.body_template = <<~ERB
    Hello,

    A new <%= my_model.class.name %> has been created:

    Name: <%= my_model.name %>
    <% if created_by %>
    Created by: <%= created_by.full_name %>
    <% end %>
  ERB
  template.active = true
end
```

#### Step 4: Create Subscriptions

Users can be subscribed via the admin interface or programmatically:

```ruby
NotificationSubscription.create!(
  notification_topic: topic,
  user: admin_user,
  distribution_method: "email",
  distribution_frequency: "immediate",
  active: true
)
```

### Context Variables

When calling `notify_topic`, the `context` hash can contain:

- **ActiveRecord objects**: Automatically serialized/deserialized
- **Primitive values**: Strings, numbers, booleans
- **Arrays and hashes**: Nested structures

```ruby
notify_topic("order.shipped",
  context: {
    order: @order,              # ActiveRecord object
    customer: @order.customer,  # Another AR object
    tracking_number: "ABC123",  # String
    shipped_at: Time.current    # Time
  }
)
```

In templates, access these as local variables:
```erb
Order #<%= order.id %> shipped to <%= customer.full_name %>
Tracking: <%= tracking_number %>
```

---

## Existing Notification Topics

The following topics are seeded by default:

| Key | Name | Triggered When |
|-----|------|----------------|
| `user.created` | User Created | New user account is created |
| `user.archived` | User Archived | User account is archived |
| `user.password_changed` | User Password Changed | Password reset email is sent |

---

## Troubleshooting

### Notifications Not Sending

1. **Check subscription exists and is active**
   ```ruby
   NotificationSubscription.where(
     notification_topic: topic,
     user: user,
     active: true
   )
   ```

2. **Check template exists and is active**
   ```ruby
   NotificationTemplate.where(
     notification_topic: topic,
     distribution_method: "email",
     active: true
   )
   ```

3. **Check queue items**
   ```ruby
   NotificationQueueItem.where(user: user).order(created_at: :desc)
   ```

4. **Check GoodJob dashboard**
   Navigate to `/admin/good_job` to see job status and errors.

### Template Errors

If a template fails to render, check the Rails logs for `NotificationTemplateRenderer error`. Common issues:

- Undefined variable: Make sure all variables are passed in context
- Nil object: Add nil checks with `<% if variable %>`
- Syntax error: Validate ERB syntax

### Summarized Notifications Not Sending

The `ProcessSummarizedNotificationsJob` runs hourly via GoodJob cron. Verify:

1. GoodJob is running: `bundle exec good_job start`
2. Cron is configured in `config/initializers/good_job.rb`
3. Queue items have `distribute_at` in the past

---

## Technical Reference

### Files

**Models:**
- `app/models/notification_topic.rb`
- `app/models/notification_template.rb`
- `app/models/notification_subscription.rb`
- `app/models/notification_message.rb`
- `app/models/notification_queue_item.rb`

**Modules (Enumerables):**
- `app/modules/notification_distribution_methods.rb` - Defines EMAIL, SMS, CHAT constants
- `app/modules/notification_distribution_frequencies.rb` - Defines IMMEDIATE, SUMMARIZED_HOURLY, SUMMARIZED_DAILY constants

**Concerns:**
- `app/models/concerns/notifiable.rb` - Mixin for triggering notifications
- `app/models/concerns/notification_template_renderer.rb` - ERB rendering
- `app/models/concerns/has_distribution_method.rb` - Validates distribution_method field
- `app/models/concerns/has_distribution_frequency.rb` - Validates distribution_frequency field with helper methods

**Jobs:**
- `app/jobs/notify_topic_job.rb`
- `app/jobs/process_immediate_notifications_job.rb`
- `app/jobs/process_summarized_notifications_job.rb`
- `app/jobs/distribute_notification_job.rb`
- `app/jobs/distribute_summarized_notifications_job.rb`

**Mailer:**
- `app/mailers/notification_mailer.rb`

**Controllers:**
- `app/controllers/admin/notification_topics_controller.rb`
- `app/controllers/admin/notification_templates_controller.rb`
- `app/controllers/admin/notification_subscriptions_controller.rb`
- `app/controllers/admin/notification_messages_controller.rb`
- `app/controllers/admin/notification_queue_items_controller.rb`
