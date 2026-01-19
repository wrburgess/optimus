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
