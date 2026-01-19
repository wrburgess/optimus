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
