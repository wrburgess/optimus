# Notification System - Implementation Kit

This kit contains everything needed to implement the Topic/Subscriber notification system in a Rails application. It is designed for AI agents (Claude Code) to follow step-by-step.

---

## Overview

The notification system implements a Topic/Subscriber pattern inspired by AWS SNS:
- **Topics** define types of notifications (e.g., "user.created")
- **Templates** define how messages are rendered per delivery channel (ERB)
- **Subscriptions** link users to topics with delivery preferences
- **Messages** store rendered notification content
- **Queue Items** track delivery status and scheduling

**Delivery Channels**: email (active), sms (stub), chat (stub)
**Scheduling**: immediate, hourly summaries, daily summaries

---

## Prerequisites

- Rails 8.0+ with PostgreSQL
- GoodJob for background processing
- Pundit for authorization
- Existing `User` model with `email` and `full_name` methods
- Existing `Archivable` and `Loggable` concerns
- Existing admin controller structure with `AdminController` base class

---

## Implementation Phases

### Phase 1: Migrations

Create these migrations in order:

#### 1.1 Add timezone to users

```ruby
# db/migrate/TIMESTAMP_add_timezone_to_users.rb
class AddTimezoneToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :timezone, :string, default: "UTC"
  end
end
```

#### 1.2 Create notification_topics

```ruby
# db/migrate/TIMESTAMP_create_notification_topics.rb
class CreateNotificationTopics < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_topics do |t|
      t.string :name, null: false
      t.string :key, null: false
      t.text :description
      t.datetime :archived_at

      t.timestamps
    end

    add_index :notification_topics, :key, unique: true
  end
end
```

#### 1.3 Create notification_templates

```ruby
# db/migrate/TIMESTAMP_create_notification_templates.rb
class CreateNotificationTemplates < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_templates do |t|
      t.references :notification_topic, null: false, foreign_key: true
      t.string :distribution_method, null: false
      t.string :subject_template
      t.text :body_template
      t.boolean :active, default: true
      t.datetime :archived_at

      t.timestamps
    end

    add_index :notification_templates, [:notification_topic_id, :distribution_method],
              unique: true,
              name: "index_notification_templates_on_topic_and_method"
  end
end
```

#### 1.4 Create notification_subscriptions

```ruby
# db/migrate/TIMESTAMP_create_notification_subscriptions.rb
class CreateNotificationSubscriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_subscriptions do |t|
      t.references :notification_topic, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :distribution_method, null: false
      t.string :distribution_frequency, null: false
      t.integer :summarized_daily_hour
      t.boolean :active, default: true
      t.datetime :archived_at

      t.timestamps
    end

    add_index :notification_subscriptions, [:notification_topic_id, :user_id, :distribution_method],
              unique: true,
              name: "index_notification_subscriptions_on_topic_user_method"
  end
end
```

#### 1.5 Create notification_messages

```ruby
# db/migrate/TIMESTAMP_create_notification_messages.rb
class CreateNotificationMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_messages do |t|
      t.references :notification_topic, null: false, foreign_key: true
      t.string :subject
      t.text :body
      t.jsonb :metadata, default: {}

      t.timestamps
    end
  end
end
```

#### 1.6 Create notification_queue_items

```ruby
# db/migrate/TIMESTAMP_create_notification_queue_items.rb
class CreateNotificationQueueItems < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_queue_items do |t|
      t.references :notification_subscription, null: false, foreign_key: true
      t.references :notification_message, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :distribution_method, null: false
      t.datetime :distribute_at, null: false
      t.datetime :distributed_at

      t.timestamps
    end

    add_index :notification_queue_items, [:distribute_at, :distributed_at],
              name: "index_notification_queue_items_on_distribute_distributed"
    add_index :notification_queue_items, [:user_id, :distribute_at],
              name: "index_notification_queue_items_on_user_distribute"
  end
end
```

After creating migrations, run: `bundle exec rails db:migrate`

---

### Phase 2: Enumerable Modules and Concerns

Enumerables are defined as plain Ruby modules in `app/modules/`. Concerns in `app/models/concerns/` reference these modules and provide validations and instance methods.

#### 2.1 NotificationDistributionMethods (Module)

```ruby
# app/modules/notification_distribution_methods.rb
module NotificationDistributionMethods
  EMAIL = "email".freeze
  SMS = "sms".freeze
  CHAT = "chat".freeze

  def self.all
    [
      EMAIL,
      SMS,
      CHAT
    ]
  end

  def self.options_for_select
    all.map { |item| [ item.titleize, item ] }
  end
end
```

#### 2.2 HasDistributionMethod (Concern)

```ruby
# app/models/concerns/has_distribution_method.rb
module HasDistributionMethod
  extend ActiveSupport::Concern

  included do
    validates :distribution_method, presence: true, inclusion: { in: NotificationDistributionMethods.all }
  end

  class_methods do
    def distribution_methods
      NotificationDistributionMethods.all
    end

    def distribution_methods_for_select
      NotificationDistributionMethods.options_for_select
    end
  end
end
```

#### 2.3 NotificationDistributionFrequencies (Module)

```ruby
# app/modules/notification_distribution_frequencies.rb
module NotificationDistributionFrequencies
  IMMEDIATE = "immediate".freeze
  SUMMARIZED_HOURLY = "summarized_hourly".freeze
  SUMMARIZED_DAILY = "summarized_daily".freeze

  def self.all
    [
      IMMEDIATE,
      SUMMARIZED_HOURLY,
      SUMMARIZED_DAILY
    ]
  end

  def self.options_for_select
    all.map { |item| [ item.titleize, item ] }
  end
end
```

#### 2.4 HasDistributionFrequency (Concern)

```ruby
# app/models/concerns/has_distribution_frequency.rb
module HasDistributionFrequency
  extend ActiveSupport::Concern

  included do
    validates :distribution_frequency, presence: true, inclusion: { in: NotificationDistributionFrequencies.all }
  end

  class_methods do
    def distribution_frequencies
      NotificationDistributionFrequencies.all
    end

    def distribution_frequencies_for_select
      NotificationDistributionFrequencies.options_for_select
    end
  end

  def immediate?
    distribution_frequency == NotificationDistributionFrequencies::IMMEDIATE
  end

  def summarized_hourly?
    distribution_frequency == NotificationDistributionFrequencies::SUMMARIZED_HOURLY
  end

  def summarized_daily?
    distribution_frequency == NotificationDistributionFrequencies::SUMMARIZED_DAILY
  end
end
```

#### 2.5 NotificationTemplateRenderer

```ruby
# app/models/concerns/notification_template_renderer.rb
module NotificationTemplateRenderer
  class RenderContext
    def initialize(context = {})
      context.each do |key, value|
        define_singleton_method(key) { value }
      end
    end

    def get_binding
      binding
    end
  end

  class << self
    def render(template_string, context = {})
      return "" if template_string.blank?

      render_context = RenderContext.new(context)
      erb = ERB.new(template_string)
      erb.result(render_context.get_binding)
    rescue SyntaxError, StandardError => e
      Rails.logger.error("NotificationTemplateRenderer error: #{e.message}")
      raise TemplateRenderError, "Failed to render template: #{e.message}"
    end

    def render_subject(template, context = {})
      render(template.subject_template, context)
    end

    def render_body(template, context = {})
      render(template.body_template, context)
    end

    def safe_render(template_string, context = {})
      render(template_string, context)
    rescue TemplateRenderError => e
      Rails.logger.warn("Template render failed, returning empty string: #{e.message}")
      ""
    end
  end

  class TemplateRenderError < StandardError; end
end
```

#### 2.4 Notifiable

```ruby
# app/models/concerns/notifiable.rb
module Notifiable
  extend ActiveSupport::Concern

  def notify_topic(topic_key, context: {})
    NotifyTopicJob.perform_later(
      topic_key: topic_key,
      context: Notifiable.serialize_context(context)
    )
  end

  class << self
    def serialize_context(context)
      context.transform_values do |value|
        if value.is_a?(ActiveRecord::Base)
          { "_class" => value.class.name, "_id" => value.id }
        else
          value
        end
      end
    end

    def deserialize_context(serialized_context)
      serialized_context.transform_values do |value|
        if value.is_a?(Hash) && value["_class"].present? && value["_id"].present?
          value["_class"].constantize.find_by(id: value["_id"])
        else
          value
        end
      end.symbolize_keys
    end
  end
end
```

---

### Phase 3: Models

#### 3.1 NotificationTopic

```ruby
# app/models/notification_topic.rb
class NotificationTopic < ApplicationRecord
  include Archivable
  include Loggable

  validates :name, presence: true
  validates :key, presence: true, uniqueness: true

  has_many :notification_templates, dependent: :destroy
  has_many :notification_subscriptions, dependent: :destroy
  has_many :notification_messages, dependent: :destroy

  scope :select_order, -> { order(:name) }

  def self.ransackable_attributes(*)
    %w[
      archived_at
      description
      id
      key
      name
      updated_at
    ]
  end

  def self.ransackable_associations(*)
    %w[
      notification_messages
      notification_subscriptions
      notification_templates
    ]
  end

  def self.options_for_select
    select_order.map { |instance| [ instance.name, instance.id ] }
  end

  def self.default_sort
    [ name: :asc, created_at: :desc ]
  end

  def self.find_by_key(key)
    find_by(key: key)
  end

  def self.find_by_key!(key)
    find_by!(key: key)
  end
end
```

#### 3.2 NotificationTemplate

```ruby
# app/models/notification_template.rb
class NotificationTemplate < ApplicationRecord
  include Archivable
  include Loggable
  include HasDistributionMethod

  belongs_to :notification_topic

  validates :subject_template, presence: true
  validates :body_template, presence: true
  validates :distribution_method, uniqueness: { scope: :notification_topic_id }

  scope :select_order, -> { order(:distribution_method) }
  scope :active, -> { where(active: true) }

  def self.ransackable_attributes(*)
    %w[
      active
      archived_at
      body_template
      distribution_method
      id
      notification_topic_id
      subject_template
      updated_at
    ]
  end

  def self.ransackable_associations(*)
    %w[notification_topic]
  end

  def self.options_for_select
    select_order.map { |instance| [ "#{instance.notification_topic.name} - #{instance.distribution_method.titleize}", instance.id ] }
  end

  def self.default_sort
    [ distribution_method: :asc, created_at: :desc ]
  end

  # Display name for admin show page headers
  def name
    "#{notification_topic.name} (#{distribution_method.titleize})"
  end
end
```

#### 3.3 NotificationSubscription

```ruby
# app/models/notification_subscription.rb
class NotificationSubscription < ApplicationRecord
  include Archivable
  include Loggable
  include HasDistributionMethod
  include HasDistributionFrequency

  belongs_to :notification_topic
  belongs_to :user

  has_many :notification_queue_items, dependent: :destroy

  validates :distribution_method, uniqueness: { scope: [ :notification_topic_id, :user_id ] }
  validates :summarized_daily_hour,
            numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 23 },
            allow_nil: true

  scope :select_order, -> { order(:distribution_method) }
  scope :active, -> { where(active: true) }
  scope :for_topic, ->(topic) { where(notification_topic: topic) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_method, ->(method) { where(distribution_method: method) }

  def self.ransackable_attributes(*)
    %w[
      active
      archived_at
      distribution_frequency
      distribution_method
      id
      notification_topic_id
      summarized_daily_hour
      updated_at
      user_id
    ]
  end

  def self.ransackable_associations(*)
    %w[notification_topic user]
  end

  def self.options_for_select
    select_order.includes(:notification_topic, :user).map do |instance|
      [ "#{instance.notification_topic.name} - #{instance.user.full_name} - #{instance.distribution_method.titleize}", instance.id ]
    end
  end

  def self.default_sort
    [ created_at: :desc ]
  end

  # Display name for admin show page headers
  def name
    "#{notification_topic.name} - #{user.full_name}"
  end
end
```

#### 3.4 NotificationMessage

```ruby
# app/models/notification_message.rb
class NotificationMessage < ApplicationRecord
  include Loggable

  belongs_to :notification_topic

  has_many :notification_queue_items, dependent: :destroy

  validates :subject, presence: true
  validates :body, presence: true

  scope :select_order, -> { order(created_at: :desc) }

  def self.ransackable_attributes(*)
    %w[
      body
      id
      metadata
      notification_topic_id
      subject
      created_at
      updated_at
    ]
  end

  def self.ransackable_associations(*)
    %w[notification_topic notification_queue_items]
  end

  def self.default_sort
    [ created_at: :desc ]
  end

  # Display name for admin show page headers
  def name
    subject.truncate(50)
  end
end
```

#### 3.5 NotificationQueueItem

```ruby
# app/models/notification_queue_item.rb
class NotificationQueueItem < ApplicationRecord
  include Loggable
  include HasDistributionMethod

  belongs_to :notification_subscription
  belongs_to :notification_message
  belongs_to :user

  validates :distribute_at, presence: true

  scope :select_order, -> { order(distribute_at: :asc) }
  scope :pending, -> { where(distributed_at: nil) }
  scope :distributed, -> { where.not(distributed_at: nil) }
  scope :ready_to_distribute, -> { pending.where("distribute_at <= ?", Time.current) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_method, ->(method) { where(distribution_method: method) }
  scope :immediate, -> { joins(:notification_subscription).where(notification_subscriptions: { distribution_frequency: "immediate" }) }
  scope :summarized, -> { joins(:notification_subscription).where.not(notification_subscriptions: { distribution_frequency: "immediate" }) }

  def self.ransackable_attributes(*)
    %w[
      distribute_at
      distributed_at
      distribution_method
      id
      notification_message_id
      notification_subscription_id
      user_id
      created_at
      updated_at
    ]
  end

  def self.ransackable_associations(*)
    %w[notification_message notification_subscription user]
  end

  def self.default_sort
    [ distribute_at: :asc ]
  end

  def distributed?
    distributed_at.present?
  end

  def pending?
    distributed_at.nil?
  end

  def mark_distributed!
    update!(distributed_at: Time.current)
  end

  # Display name for admin show page headers
  def name
    "#{user.full_name} - #{notification_message.subject.truncate(30)}"
  end
end
```

#### 3.6 Update User Model

Add to `app/models/user.rb`:

```ruby
class User < ApplicationRecord
  include Notifiable  # Add this

  # Add these associations
  has_many :notification_subscriptions, dependent: :destroy
  has_many :notification_queue_items, dependent: :destroy

  # ... rest of existing code
end
```

---

### Phase 4: Jobs

#### 4.1 NotifyTopicJob

```ruby
# app/jobs/notify_topic_job.rb
class NotifyTopicJob < ApplicationJob
  queue_as :default

  def perform(topic_key:, context:)
    topic = NotificationTopic.find_by_key!(topic_key)
    deserialized_context = Notifiable.deserialize_context(context)

    # Get active subscriptions for this topic
    subscriptions = topic.notification_subscriptions.active.includes(:user)

    return if subscriptions.empty?

    # Group subscriptions by distribution method and render templates
    subscriptions.group_by(&:distribution_method).each do |method, method_subscriptions|
      template = topic.notification_templates.active.find_by(distribution_method: method)
      next unless template

      # Render the message once per method
      rendered_subject = NotificationTemplateRenderer.render_subject(template, deserialized_context)
      rendered_body = NotificationTemplateRenderer.render_body(template, deserialized_context)

      # Create the notification message
      message = NotificationMessage.create!(
        notification_topic: topic,
        subject: rendered_subject,
        body: rendered_body,
        metadata: context
      )

      # Create queue items for each subscription
      method_subscriptions.each do |subscription|
        distribute_at = calculate_distribute_at(subscription)

        NotificationQueueItem.create!(
          notification_subscription: subscription,
          notification_message: message,
          user: subscription.user,
          distribution_method: method,
          distribute_at: distribute_at
        )
      end
    end

    # Process immediate notifications right away
    ProcessImmediateNotificationsJob.perform_later
  end

  private

  def calculate_distribute_at(subscription)
    case subscription.distribution_frequency
    when NotificationDistributionFrequencies::IMMEDIATE
      Time.current
    when NotificationDistributionFrequencies::SUMMARIZED_HOURLY
      next_hour
    when NotificationDistributionFrequencies::SUMMARIZED_DAILY
      next_daily_hour(subscription)
    else
      Time.current
    end
  end

  def next_hour
    Time.current.beginning_of_hour + 1.hour
  end

  def next_daily_hour(subscription)
    user_timezone = subscription.user.timezone || "UTC"
    hour = subscription.summarized_daily_hour || 9

    Time.use_zone(user_timezone) do
      today_at_hour = Time.zone.today.in_time_zone.change(hour: hour)

      if Time.current >= today_at_hour
        today_at_hour + 1.day
      else
        today_at_hour
      end
    end
  end
end
```

#### 4.2 ProcessImmediateNotificationsJob

```ruby
# app/jobs/process_immediate_notifications_job.rb
class ProcessImmediateNotificationsJob < ApplicationJob
  queue_as :default

  def perform
    # Find all pending immediate notification queue items that are ready to distribute
    pending_items = NotificationQueueItem
      .pending
      .ready_to_distribute
      .immediate
      .includes(:notification_message, :user)

    pending_items.find_each do |item|
      DistributeNotificationJob.perform_later(notification_queue_item_id: item.id)
    end
  end
end
```

#### 4.3 ProcessSummarizedNotificationsJob

```ruby
# app/jobs/process_summarized_notifications_job.rb
class ProcessSummarizedNotificationsJob < ApplicationJob
  queue_as :default

  def perform
    # Find all pending summarized notification queue items that are ready to distribute
    pending_items = NotificationQueueItem
      .pending
      .ready_to_distribute
      .summarized
      .includes(:notification_message, :user, :notification_subscription)

    # Group by user and distribution method for batch sending
    grouped_items = pending_items.group_by { |item| [ item.user_id, item.distribution_method ] }

    grouped_items.each do |(user_id, method), items|
      item_ids = items.map(&:id)
      DistributeSummarizedNotificationsJob.perform_later(
        user_id: user_id,
        distribution_method: method,
        notification_queue_item_ids: item_ids
      )
    end
  end
end
```

#### 4.4 DistributeNotificationJob

```ruby
# app/jobs/distribute_notification_job.rb
class DistributeNotificationJob < ApplicationJob
  queue_as :default

  def perform(notification_queue_item_id:)
    item = NotificationQueueItem.find_by(id: notification_queue_item_id)
    return unless item
    return if item.distributed?

    case item.distribution_method
    when NotificationDistributionMethods::EMAIL
      deliver_email(item)
    when NotificationDistributionMethods::SMS
      deliver_sms(item)
    when NotificationDistributionMethods::CHAT
      deliver_chat(item)
    end

    item.mark_distributed!
  end

  private

  def deliver_email(item)
    NotificationMailer.single_notification(
      user: item.user,
      subject: item.notification_message.subject,
      body: item.notification_message.body
    ).deliver_now
  end

  def deliver_sms(item)
    # Future implementation
    Rails.logger.info("SMS delivery not yet implemented for queue item #{item.id}")
  end

  def deliver_chat(item)
    # Future implementation
    Rails.logger.info("Chat delivery not yet implemented for queue item #{item.id}")
  end
end
```

#### 4.5 DistributeSummarizedNotificationsJob

```ruby
# app/jobs/distribute_summarized_notifications_job.rb
class DistributeSummarizedNotificationsJob < ApplicationJob
  queue_as :default

  def perform(user_id:, distribution_method:, notification_queue_item_ids:)
    user = User.find_by(id: user_id)
    return unless user

    items = NotificationQueueItem
      .where(id: notification_queue_item_ids)
      .pending
      .includes(:notification_message)

    return if items.empty?

    messages = items.map(&:notification_message).uniq

    case distribution_method
    when NotificationDistributionMethods::EMAIL
      deliver_email_summary(user, messages)
    when NotificationDistributionMethods::SMS
      deliver_sms_summary(user, messages)
    when NotificationDistributionMethods::CHAT
      deliver_chat_summary(user, messages)
    end

    # Mark all items as distributed
    items.each(&:mark_distributed!)
  end

  private

  def deliver_email_summary(user, messages)
    NotificationMailer.summarized_notification(
      user: user,
      messages: messages
    ).deliver_now
  end

  def deliver_sms_summary(user, messages)
    # Future implementation
    Rails.logger.info("SMS summary delivery not yet implemented for user #{user.id}")
  end

  def deliver_chat_summary(user, messages)
    # Future implementation
    Rails.logger.info("Chat summary delivery not yet implemented for user #{user.id}")
  end
end
```

---

### Phase 5: GoodJob Cron Configuration

Create or update `config/initializers/good_job.rb`:

```ruby
# config/initializers/good_job.rb
Rails.application.configure do
  config.good_job.cron = {
    process_summarized_notifications: {
      cron: "0 * * * *", # Every hour at minute 0
      class: "ProcessSummarizedNotificationsJob",
      description: "Process pending summarized notifications"
    }
  }
end
```

---

### Phase 6: Mailer

#### 6.1 NotificationMailer

```ruby
# app/mailers/notification_mailer.rb
class NotificationMailer < ApplicationMailer
  def single_notification(user:, subject:, body:)
    @user = user
    @subject = subject
    @body = body

    mail(
      to: @user.email,
      subject: @subject
    )
  end

  def summarized_notification(user:, messages:)
    @user = user
    @messages = messages
    @subject = "You have #{messages.count} new notification#{'s' if messages.count > 1}"

    mail(
      to: @user.email,
      subject: @subject
    )
  end
end
```

#### 6.2 Single Notification Views

```erb
<%# app/views/notification_mailer/single_notification.html.erb %>
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;"><%= @subject %></h2>
  <div style="color: #555; line-height: 1.6;">
    <%= simple_format(@body) %>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">
    This notification was sent to <%= @user.email %>.
  </p>
</div>
```

```erb
<%# app/views/notification_mailer/single_notification.text.erb %>
<%= @subject %>
<%= "=" * @subject.length %>

<%= @body %>

---
This notification was sent to <%= @user.email %>.
```

#### 6.3 Summarized Notification Views

```erb
<%# app/views/notification_mailer/summarized_notification.html.erb %>
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;"><%= @subject %></h2>
  <p style="color: #666;">Hello <%= @user.full_name %>,</p>
  <p style="color: #666;">Here is a summary of your recent notifications:</p>

  <% @messages.each do |message| %>
    <div style="background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 4px;">
      <h3 style="color: #333; margin: 0 0 10px 0;"><%= message.subject %></h3>
      <div style="color: #555; line-height: 1.6;">
        <%= simple_format(message.body) %>
      </div>
      <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
        <%= message.created_at.strftime("%B %d, %Y at %I:%M %p") %>
      </p>
    </div>
  <% end %>

  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">
    This notification was sent to <%= @user.email %>.
  </p>
</div>
```

```erb
<%# app/views/notification_mailer/summarized_notification.text.erb %>
<%= @subject %>
<%= "=" * @subject.length %>

Hello <%= @user.full_name %>,

Here is a summary of your recent notifications:

<% @messages.each do |message| %>
--------------------
<%= message.subject %>
<%= message.created_at.strftime("%B %d, %Y at %I:%M %p") %>

<%= message.body %>

<% end %>
---
This notification was sent to <%= @user.email %>.
```

---

### Phase 7: Admin Controllers

#### 7.1 NotificationTopicsController

```ruby
# app/controllers/admin/notification_topics_controller.rb
class Admin::NotificationTopicsController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result)
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_templates, :notification_subscriptions).find(params[:id])
  end

  def new
    @instance = controller_class.new
  end

  def create
    instance = controller_class.create(create_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json)
    flash[:success] = "New #{instance.class_name_title} successfully created"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def edit
    @instance = controller_class.find(params[:id])
  end

  def update
    instance = controller_class.find(params[:id])
    original_instance = instance.dup

    instance.update(update_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json, original_data: original_instance.attributes.to_json)
    flash[:success] = "#{instance.class_name_title} successfully updated"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def collection_export_xlsx
    sql = %(
      SELECT
        *
      FROM
        notification_topics
      ORDER BY
        notification_topics.id;
    )

    @results = ActiveRecord::Base.connection.select_all(sql)
    file_name = controller_class_plural

    send_data(
      render_to_string(
        template: "admin/xlsx/reports",
        formats: [ :xlsx ],
        handlers: [ :axlsx ],
        layout: false
      ),
      filename: helpers.file_name_with_timestamp(file_name: file_name, file_extension: "xlsx"),
      type: Mime[:xlsx]
    )
  end

  private

  def create_params
    params.require(controller_class_symbolized).permit(
      :name,
      :key,
      :description
    )
  end

  def update_params
    params.require(controller_class_symbolized).permit(
      :name,
      :key,
      :description
    )
  end
end
```

#### 7.2 NotificationTemplatesController

```ruby
# app/controllers/admin/notification_templates_controller.rb
class Admin::NotificationTemplatesController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result.includes(:notification_topic))
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_topic).find(params[:id])
  end

  def new
    @instance = controller_class.new
  end

  def create
    instance = controller_class.create(create_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json)
    flash[:success] = "New #{instance.class_name_title} successfully created"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def edit
    @instance = controller_class.find(params[:id])
  end

  def update
    instance = controller_class.find(params[:id])
    original_instance = instance.dup

    instance.update(update_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json, original_data: original_instance.attributes.to_json)
    flash[:success] = "#{instance.class_name_title} successfully updated"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  private

  def create_params
    params.require(controller_class_symbolized).permit(
      :notification_topic_id,
      :distribution_method,
      :subject_template,
      :body_template,
      :active
    )
  end

  def update_params
    params.require(controller_class_symbolized).permit(
      :notification_topic_id,
      :distribution_method,
      :subject_template,
      :body_template,
      :active
    )
  end
end
```

#### 7.3 NotificationSubscriptionsController

```ruby
# app/controllers/admin/notification_subscriptions_controller.rb
class Admin::NotificationSubscriptionsController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result.includes(:notification_topic, :user))
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_topic, :user).find(params[:id])
  end

  def new
    @instance = controller_class.new
  end

  def create
    instance = controller_class.create(create_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json)
    flash[:success] = "New #{instance.class_name_title} successfully created"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def edit
    @instance = controller_class.find(params[:id])
  end

  def update
    instance = controller_class.find(params[:id])
    original_instance = instance.dup

    instance.update(update_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json, original_data: original_instance.attributes.to_json)
    flash[:success] = "#{instance.class_name_title} successfully updated"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def collection_export_xlsx
    sql = %(
      SELECT
        notification_subscriptions.*,
        notification_topics.name as topic_name,
        users.email as user_email
      FROM
        notification_subscriptions
      LEFT JOIN notification_topics ON notification_subscriptions.notification_topic_id = notification_topics.id
      LEFT JOIN users ON notification_subscriptions.user_id = users.id
      ORDER BY
        notification_subscriptions.id;
    )

    @results = ActiveRecord::Base.connection.select_all(sql)
    file_name = controller_class_plural

    send_data(
      render_to_string(
        template: "admin/xlsx/reports",
        formats: [ :xlsx ],
        handlers: [ :axlsx ],
        layout: false
      ),
      filename: helpers.file_name_with_timestamp(file_name: file_name, file_extension: "xlsx"),
      type: Mime[:xlsx]
    )
  end

  private

  def create_params
    params.require(controller_class_symbolized).permit(
      :notification_topic_id,
      :user_id,
      :distribution_method,
      :distribution_frequency,
      :summarized_daily_hour,
      :active
    )
  end

  def update_params
    params.require(controller_class_symbolized).permit(
      :notification_topic_id,
      :user_id,
      :distribution_method,
      :distribution_frequency,
      :summarized_daily_hour,
      :active
    )
  end
end
```

#### 7.4 NotificationMessagesController (Read-only)

```ruby
# app/controllers/admin/notification_messages_controller.rb
class Admin::NotificationMessagesController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result.includes(:notification_topic))
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_topic, :notification_queue_items).find(params[:id])
  end

  def collection_export_xlsx
    sql = %(
      SELECT
        notification_messages.*,
        notification_topics.name as topic_name
      FROM
        notification_messages
      LEFT JOIN notification_topics ON notification_messages.notification_topic_id = notification_topics.id
      ORDER BY
        notification_messages.id DESC;
    )

    @results = ActiveRecord::Base.connection.select_all(sql)
    file_name = controller_class_plural

    send_data(
      render_to_string(
        template: "admin/xlsx/reports",
        formats: [ :xlsx ],
        handlers: [ :axlsx ],
        layout: false
      ),
      filename: helpers.file_name_with_timestamp(file_name: file_name, file_extension: "xlsx"),
      type: Mime[:xlsx]
    )
  end
end
```

#### 7.5 NotificationQueueItemsController (Read-only)

```ruby
# app/controllers/admin/notification_queue_items_controller.rb
class Admin::NotificationQueueItemsController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result.includes(:notification_message, :notification_subscription, :user))
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_message, :notification_subscription, :user).find(params[:id])
  end

  def collection_export_xlsx
    sql = %(
      SELECT
        notification_queue_items.*,
        users.email as user_email,
        notification_messages.subject as message_subject
      FROM
        notification_queue_items
      LEFT JOIN users ON notification_queue_items.user_id = users.id
      LEFT JOIN notification_messages ON notification_queue_items.notification_message_id = notification_messages.id
      ORDER BY
        notification_queue_items.id DESC;
    )

    @results = ActiveRecord::Base.connection.select_all(sql)
    file_name = controller_class_plural

    send_data(
      render_to_string(
        template: "admin/xlsx/reports",
        formats: [ :xlsx ],
        handlers: [ :axlsx ],
        layout: false
      ),
      filename: helpers.file_name_with_timestamp(file_name: file_name, file_extension: "xlsx"),
      type: Mime[:xlsx]
    )
  end
end
```

---

### Phase 8: Policies

All policies inherit from `AdminApplicationPolicy`:

```ruby
# app/policies/admin/notification_topic_policy.rb
class Admin::NotificationTopicPolicy < AdminApplicationPolicy; end

# app/policies/admin/notification_template_policy.rb
class Admin::NotificationTemplatePolicy < AdminApplicationPolicy; end

# app/policies/admin/notification_subscription_policy.rb
class Admin::NotificationSubscriptionPolicy < AdminApplicationPolicy; end

# app/policies/admin/notification_message_policy.rb
class Admin::NotificationMessagePolicy < AdminApplicationPolicy; end

# app/policies/admin/notification_queue_item_policy.rb
class Admin::NotificationQueueItemPolicy < AdminApplicationPolicy; end
```

---

### Phase 9: Routes

Add to `config/routes.rb` inside the `namespace :admin` block:

```ruby
namespace :admin do
  # ... existing routes ...

  resources :notification_topics, concerns: [:archivable, :collection_exportable]
  resources :notification_templates, concerns: :archivable
  resources :notification_subscriptions, concerns: [:archivable, :collection_exportable]
  resources :notification_messages, only: [:index, :show], concerns: :collection_exportable
  resources :notification_queue_items, only: [:index, :show], concerns: :collection_exportable
end
```

---

### Phase 10: Seeds

Create `db/seeds/notification_topics.rb`:

```ruby
# db/seeds/notification_topics.rb
# CUSTOMIZE: Modify these topics for your application's needs

topics = [
  {
    key: "user.password_changed",
    name: "User Password Changed",
    description: "Notification sent when a user's password is changed",
    template: {
      subject_template: "Password Changed for <%= user.full_name %>",
      body_template: "Hello,\n\nThe password for <%= user.full_name %> (<%= user.email %>) was changed<% if changed_by %> by <%= changed_by.full_name %><% end %>.\n\nIf you did not make this change, please contact your administrator immediately."
    }
  },
  {
    key: "user.created",
    name: "User Created",
    description: "Notification sent when a new user account is created",
    template: {
      subject_template: "New User Created: <%= user.full_name %>",
      body_template: "Hello,\n\nA new user account has been created:\n\nName: <%= user.full_name %>\nEmail: <%= user.email %><% if created_by %>\nCreated by: <%= created_by.full_name %><% end %>"
    }
  },
  {
    key: "user.archived",
    name: "User Archived",
    description: "Notification sent when a user account is archived",
    template: {
      subject_template: "User Archived: <%= user.full_name %>",
      body_template: "Hello,\n\nThe following user account has been archived:\n\nName: <%= user.full_name %>\nEmail: <%= user.email %><% if archived_by %>\nArchived by: <%= archived_by.full_name %><% end %>"
    }
  }
]

topics.each do |topic_data|
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

puts "Created #{NotificationTopic.count} notification topics"
puts "Created #{NotificationTemplate.count} notification templates"
```

Update `db/seeds.rb` to include the notification seeds:

```ruby
# Add this line to db/seeds.rb
require_relative "seeds/notification_topics"
```

Run seeds: `bundle exec rails db:seed`

---

### Phase 11: Admin Views

Create these view files. Use your application's existing view patterns as a reference.

#### Directory Structure

```
app/views/admin/
├── notification_topics/
│   ├── index.html.erb
│   ├── show.html.erb
│   ├── new.html.erb
│   ├── edit.html.erb
│   └── _form.html.erb
├── notification_templates/
│   ├── index.html.erb
│   ├── show.html.erb
│   ├── new.html.erb
│   ├── edit.html.erb
│   └── _form.html.erb
├── notification_subscriptions/
│   ├── index.html.erb
│   ├── show.html.erb
│   ├── new.html.erb
│   ├── edit.html.erb
│   └── _form.html.erb
├── notification_messages/
│   ├── index.html.erb
│   └── show.html.erb
└── notification_queue_items/
    ├── index.html.erb
    └── show.html.erb
```

#### Example: notification_topics/index.html.erb

```erb
<%= render Admin::HeaderForIndex::Component.new(
    instance: @instance,
    controller: params[:controller],
    action: params[:action],
    new_button: true,
    collection_export_xlsx_button: true,
    show_filtering: true
  )
%>

<%= render Admin::PageContainer::Component.new do %>

  <%= render Admin::TableForIndex::Component.new(data: @instances) do |table| %>
    <% table.with_column(sort_link([:admin, @q], :id, "ID")) { |instance| instance.id.to_s } %>
    <% table.with_column(sort_link([:admin, @q], :name, "Name", default_order: :asc)) { |instance| instance.name } %>
    <% table.with_column(sort_link([:admin, @q], :key, "Key")) { |instance| instance.key } %>
    <% table.with_column(sort_link([:admin, @q], :updated_at, "Updated")) { |instance| default_date_format(instance.updated_at) } %>
    <% table.with_column("Actions") do |instance| %>
      <%= render Admin::ActionButton::Component.new(operation: :show, instance: instance, button_classes: "me-3", icon_classes: :none) %>
      <%= render Admin::ActionButton::Component.new(operation: :edit, instance: instance, button_classes: :none, icon_classes: :none) %>
    <% end %>
  <% end %>

  <%= render Admin::IndexPager::Component.new(pagy: @pagy, instance: @instance) %>

  <%= render Admin::FilterCard::Component.new do %>
    <%= simple_form_for [:admin, @q], url: polymorphic_path([:admin, @instance]), html: { method: :get }, wrapper: :floating_labels_form do |f| %>
      <%= f.input :id_eq, label: "ID", placeholder: "ID equals" %>
      <%= f.input :name_cont, label: "Name", placeholder: "Name contains" %>
      <%= f.input :key_cont, label: "Key", placeholder: "Key contains" %>

      <%= render Admin::FormButton::Component.new(operation: :filter) %>
      <%= render Admin::LinkButton::Component.new(text: 'Reset Form', path: request.path) %>
    <% end %>
  <% end %>
<% end %>
```

#### Example: notification_templates/_form.html.erb

```erb
<%= simple_form_for([:admin, instance], local: true) do |f| %>
  <div class="row">
    <div class="col-12 col-lg-6">
      <% unless instance.new_record? %>
        <%= f.input :id, readonly: true, wrapper: :floating_label_form %>
      <% end %>
      <%= f.input :notification_topic_id,
          collection: NotificationTopic.options_for_select,
          label: 'Topic',
          prompt: 'Select a topic...',
          wrapper: :floating_label_form %>
      <%= f.input :distribution_method,
          collection: NotificationTemplate.distribution_methods_for_select,
          label: 'Distribution Method',
          prompt: 'Select a method...',
          wrapper: :floating_label_form %>
      <%= f.input :active, as: :boolean, wrapper: :floating_label_form %>
      <%= f.input :subject_template, wrapper: :floating_label_form, hint: "ERB template for email subject. Example: Hello &lt;%= user.name %&gt;" %>
      <%= f.input :body_template, as: :text, wrapper: :floating_label_form, input_html: { rows: 10 }, hint: "ERB template for email body. Example: Hello &lt;%= user.name %&gt;" %>
    </div>
  </div>
  <div class="row">
    <div class="form-group">
      <%= render Admin::ActionButton::Component.new(operation: :cancel_to_show, instance: instance, classes_append: "me-3", public: true) %>
      <%= render Admin::FormButton::Component.new(operation: :submit) %>
    </div>
  </div>
<% end %>
```

**Note**: Adapt these views to match your application's existing admin view patterns and ViewComponents.

---

## Customization Points

### CUSTOMIZE: Topics

Modify `db/seeds/notification_topics.rb` to define your application-specific notification topics.

### CUSTOMIZE: Integration Points

Add `notify_topic` calls to your controllers/models where events should trigger notifications:

```ruby
# Example: In a controller
def create
  @instance = Model.create(params)

  if @instance.persisted?
    @instance.notify_topic("model.created",
      context: {
        model: @instance,
        created_by: current_user
      }
    )
  end
end
```

### CUSTOMIZE: Template Variables

Pass whatever context your templates need. ActiveRecord objects are automatically serialized/deserialized:

```ruby
notify_topic("order.shipped",
  context: {
    order: @order,              # AR object
    customer: @order.customer,  # AR object
    tracking_number: "ABC123",  # String
    shipped_at: Time.current    # Time
  }
)
```

### CUSTOMIZE: SMS/Chat Delivery

Implement the stub methods in `DistributeNotificationJob` and `DistributeSummarizedNotificationsJob`:

```ruby
def deliver_sms(item)
  # Implement Twilio, etc.
end

def deliver_chat(item)
  # Implement Slack, etc.
end
```

### CUSTOMIZE: Admin Navigation Links

Add links to the notification resources in your admin navigation and dashboard so users can access them.

#### Nav Bar

If your app has an admin nav bar component, add a "Notifications" dropdown:

```erb
<%# Example: app/components/admin/nav_bar/component.html.erb %>
<%= render Admin::NavItem::Component.new(title: "Notifications") do |nav_item| %>
  <% nav_item.with_dropdown_item(resource: NotificationTopic, name: "Topics", path: admin_notification_topics_path) %>
  <% nav_item.with_dropdown_item(resource: NotificationTemplate, name: "Templates", path: admin_notification_templates_path) %>
  <% nav_item.with_dropdown_item(resource: NotificationSubscription, name: "Subscriptions", path: admin_notification_subscriptions_path) %>
  <% nav_item.with_dropdown_item(resource: NotificationMessage, name: "Messages", path: admin_notification_messages_path) %>
  <% nav_item.with_dropdown_item(resource: NotificationQueueItem, name: "Queue Items", path: admin_notification_queue_items_path) %>
<% end %>
```

#### Dashboard

If your app has an admin dashboard, add a "Notifications" card:

```erb
<%# Example: app/views/admin/dashboard/index.html.erb %>
<%= render Admin::DashboardCard::Component.new(title: "Notifications") do |card| %>
  <% card.with_link(name: "Topics", url: polymorphic_path([ :admin, NotificationTopic ]), policy: NotificationTopic) %>
  <% card.with_link(name: "Templates", url: polymorphic_path([ :admin, NotificationTemplate ]), policy: NotificationTemplate) %>
  <% card.with_link(name: "Subscriptions", url: polymorphic_path([ :admin, NotificationSubscription ]), policy: NotificationSubscription) %>
  <% card.with_link(name: "Messages", url: polymorphic_path([ :admin, NotificationMessage ]), policy: NotificationMessage) %>
  <% card.with_link(name: "Queue Items", url: polymorphic_path([ :admin, NotificationQueueItem ]), policy: NotificationQueueItem) %>
<% end %>
```

**Note**: Adapt these examples to match your application's existing navigation patterns and components.

---

## Verification Checklist

After implementation:

1. [ ] Run `bundle exec rails db:migrate`
2. [ ] Run `bundle exec rails db:seed`
3. [ ] Run `bundle exec rspec` - all tests pass
4. [ ] Run `bundle exec rubocop -a` - no violations
5. [ ] Start dev server: `bin/dev`
6. [ ] Navigate to `/admin/notification_topics` - verify CRUD
7. [ ] Create a subscription for a test user
8. [ ] Trigger a notification (e.g., create a user)
9. [ ] Check GoodJob dashboard at `/admin/good_job`
10. [ ] Verify email delivery (check logs or letter_opener)

---

## File Reference

| Component | Path |
|-----------|------|
| Migrations | `db/migrate/TIMESTAMP_*.rb` |
| Models | `app/models/notification_*.rb` |
| Modules | `app/modules/notification_distribution_*.rb` |
| Concerns | `app/models/concerns/has_distribution_*.rb`, `app/models/concerns/notifiable.rb`, `app/models/concerns/notification_template_renderer.rb` |
| Jobs | `app/jobs/*_notification*_job.rb` |
| Mailer | `app/mailers/notification_mailer.rb` |
| Mailer Views | `app/views/notification_mailer/*.erb` |
| Admin Controllers | `app/controllers/admin/notification_*_controller.rb` |
| Admin Policies | `app/policies/admin/notification_*_policy.rb` |
| Admin Views | `app/views/admin/notification_*/*.erb` |
| Seeds | `db/seeds/notification_topics.rb` |
| GoodJob Config | `config/initializers/good_job.rb` |
