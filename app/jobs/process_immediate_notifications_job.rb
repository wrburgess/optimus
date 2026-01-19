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
