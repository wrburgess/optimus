require "rails_helper"

RSpec.describe ProcessImmediateNotificationsJob, type: :job do
  let(:user) { create(:user) }
  let(:topic) { create(:notification_topic) }
  let(:message) { create(:notification_message, notification_topic: topic) }
  let(:subscription) do
    create(:notification_subscription,
      notification_topic: topic,
      user: user,
      distribution_method: "email",
      distribution_frequency: "immediate")
  end

  describe "#perform" do
    it "enqueues DistributeNotificationJob for each pending immediate item" do
      item = create(:notification_queue_item,
        notification_subscription: subscription,
        notification_message: message,
        user: user,
        distribution_method: "email",
        distribute_at: 1.minute.ago,
        distributed_at: nil)

      expect do
        described_class.perform_now
      end.to have_enqueued_job(DistributeNotificationJob).with(notification_queue_item_id: item.id)
    end

    it "does not enqueue for already distributed items" do
      create(:notification_queue_item,
        notification_subscription: subscription,
        notification_message: message,
        user: user,
        distribution_method: "email",
        distribute_at: 1.minute.ago,
        distributed_at: Time.current)

      expect do
        described_class.perform_now
      end.not_to have_enqueued_job(DistributeNotificationJob)
    end

    it "does not enqueue for future distribute_at" do
      create(:notification_queue_item,
        notification_subscription: subscription,
        notification_message: message,
        user: user,
        distribution_method: "email",
        distribute_at: 1.hour.from_now,
        distributed_at: nil)

      expect do
        described_class.perform_now
      end.not_to have_enqueued_job(DistributeNotificationJob)
    end

    it "does not enqueue for summarized subscriptions" do
      hourly_subscription = create(:notification_subscription,
        notification_topic: topic,
        user: user,
        distribution_method: "sms",
        distribution_frequency: "summarized_hourly")

      create(:notification_queue_item,
        notification_subscription: hourly_subscription,
        notification_message: message,
        user: user,
        distribution_method: "sms",
        distribute_at: 1.minute.ago,
        distributed_at: nil)

      expect do
        described_class.perform_now
      end.not_to have_enqueued_job(DistributeNotificationJob)
    end
  end
end
