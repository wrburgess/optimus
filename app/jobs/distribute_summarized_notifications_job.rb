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
