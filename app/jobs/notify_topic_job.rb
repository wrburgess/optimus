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
