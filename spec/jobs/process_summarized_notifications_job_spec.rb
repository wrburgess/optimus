require "rails_helper"

RSpec.describe ProcessSummarizedNotificationsJob, type: :job do
  let(:user) { create(:user) }
  let(:topic) { create(:notification_topic) }
  let(:message) { create(:notification_message, notification_topic: topic) }
  let(:subscription) do
    create(:notification_subscription,
      notification_topic: topic,
      user: user,
      distribution_method: "email",
      distribution_frequency: "summarized_hourly")
  end

  describe "#perform" do
    it "enqueues DistributeSummarizedNotificationsJob for each user/method group" do
      item = create(:notification_queue_item,
        notification_subscription: subscription,
        notification_message: message,
        user: user,
        distribution_method: "email",
        distribute_at: 1.minute.ago,
        distributed_at: nil)

      expect do
        described_class.perform_now
      end.to have_enqueued_job(DistributeSummarizedNotificationsJob).with(
        user_id: user.id,
        distribution_method: "email",
        notification_queue_item_ids: [item.id]
      )
    end

    it "groups multiple items for same user and method" do
      item1 = create(:notification_queue_item,
        notification_subscription: subscription,
        notification_message: message,
        user: user,
        distribution_method: "email",
        distribute_at: 1.minute.ago,
        distributed_at: nil)

      message2 = create(:notification_message, notification_topic: topic)
      item2 = create(:notification_queue_item,
        notification_subscription: subscription,
        notification_message: message2,
        user: user,
        distribution_method: "email",
        distribute_at: 1.minute.ago,
        distributed_at: nil)

      expect do
        described_class.perform_now
      end.to have_enqueued_job(DistributeSummarizedNotificationsJob).with(
        user_id: user.id,
        distribution_method: "email",
        notification_queue_item_ids: contain_exactly(item1.id, item2.id)
      )
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
      end.not_to have_enqueued_job(DistributeSummarizedNotificationsJob)
    end

    it "does not enqueue for immediate subscriptions" do
      immediate_subscription = create(:notification_subscription,
        notification_topic: topic,
        user: user,
        distribution_method: "sms",
        distribution_frequency: "immediate")

      create(:notification_queue_item,
        notification_subscription: immediate_subscription,
        notification_message: message,
        user: user,
        distribution_method: "sms",
        distribute_at: 1.minute.ago,
        distributed_at: nil)

      expect do
        described_class.perform_now
      end.not_to have_enqueued_job(DistributeSummarizedNotificationsJob)
    end
  end
end
