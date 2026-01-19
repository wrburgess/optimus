require "rails_helper"

RSpec.describe DistributeNotificationJob, type: :job do
  let(:user) { create(:user, email: "test@example.com") }
  let(:topic) { create(:notification_topic) }
  let(:message) { create(:notification_message, notification_topic: topic, subject: "Test Subject", body: "Test Body") }
  let(:subscription) do
    create(:notification_subscription,
      notification_topic: topic,
      user: user,
      distribution_method: "email",
      distribution_frequency: "immediate")
  end
  let(:queue_item) do
    create(:notification_queue_item,
      notification_subscription: subscription,
      notification_message: message,
      user: user,
      distribution_method: "email",
      distribute_at: Time.current,
      distributed_at: nil)
  end

  describe "#perform" do
    it "sends an email notification" do
      expect do
        described_class.perform_now(notification_queue_item_id: queue_item.id)
      end.to change { ActionMailer::Base.deliveries.count }.by(1)
    end

    it "marks the queue item as distributed" do
      freeze_time do
        described_class.perform_now(notification_queue_item_id: queue_item.id)
        queue_item.reload

        expect(queue_item.distributed_at).to eq(Time.current)
      end
    end

    it "does not send if item is already distributed" do
      queue_item.update!(distributed_at: Time.current)

      expect do
        described_class.perform_now(notification_queue_item_id: queue_item.id)
      end.not_to change { ActionMailer::Base.deliveries.count }
    end

    it "does nothing if item is not found" do
      expect do
        described_class.perform_now(notification_queue_item_id: 0)
      end.not_to change { ActionMailer::Base.deliveries.count }
    end

    context "with SMS distribution method" do
      let(:queue_item) do
        sms_subscription = create(:notification_subscription,
          notification_topic: topic,
          user: user,
          distribution_method: "sms",
          distribution_frequency: "immediate")

        create(:notification_queue_item,
          notification_subscription: sms_subscription,
          notification_message: message,
          user: user,
          distribution_method: "sms",
          distribute_at: Time.current,
          distributed_at: nil)
      end

      it "marks as distributed even for unimplemented SMS" do
        described_class.perform_now(notification_queue_item_id: queue_item.id)
        queue_item.reload

        expect(queue_item.distributed?).to be true
      end
    end
  end
end
