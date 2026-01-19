require "rails_helper"

RSpec.describe DistributeSummarizedNotificationsJob, type: :job do
  let(:user) { create(:user, email: "test@example.com") }
  let(:topic) { create(:notification_topic) }
  let(:message1) { create(:notification_message, notification_topic: topic, subject: "Subject 1", body: "Body 1") }
  let(:message2) { create(:notification_message, notification_topic: topic, subject: "Subject 2", body: "Body 2") }
  let(:subscription) do
    create(:notification_subscription,
      notification_topic: topic,
      user: user,
      distribution_method: "email",
      distribution_frequency: "summarized_hourly")
  end
  let(:item1) do
    create(:notification_queue_item,
      notification_subscription: subscription,
      notification_message: message1,
      user: user,
      distribution_method: "email",
      distribute_at: 1.minute.ago,
      distributed_at: nil)
  end
  let(:item2) do
    create(:notification_queue_item,
      notification_subscription: subscription,
      notification_message: message2,
      user: user,
      distribution_method: "email",
      distribute_at: 1.minute.ago,
      distributed_at: nil)
  end

  describe "#perform" do
    it "sends a summarized email notification" do
      expect do
        described_class.perform_now(
          user_id: user.id,
          distribution_method: "email",
          notification_queue_item_ids: [item1.id, item2.id]
        )
      end.to change { ActionMailer::Base.deliveries.count }.by(1)
    end

    it "marks all queue items as distributed" do
      freeze_time do
        described_class.perform_now(
          user_id: user.id,
          distribution_method: "email",
          notification_queue_item_ids: [item1.id, item2.id]
        )

        [item1, item2].each do |item|
          item.reload
          expect(item.distributed_at).to eq(Time.current)
        end
      end
    end

    it "does not process already distributed items" do
      item1.update!(distributed_at: Time.current)

      described_class.perform_now(
        user_id: user.id,
        distribution_method: "email",
        notification_queue_item_ids: [item1.id, item2.id]
      )

      expect(ActionMailer::Base.deliveries.count).to eq(1)
    end

    it "does nothing if user is not found" do
      expect do
        described_class.perform_now(
          user_id: 0,
          distribution_method: "email",
          notification_queue_item_ids: [item1.id]
        )
      end.not_to change { ActionMailer::Base.deliveries.count }
    end

    it "does nothing if no pending items" do
      item1.update!(distributed_at: Time.current)
      item2.update!(distributed_at: Time.current)

      expect do
        described_class.perform_now(
          user_id: user.id,
          distribution_method: "email",
          notification_queue_item_ids: [item1.id, item2.id]
        )
      end.not_to change { ActionMailer::Base.deliveries.count }
    end
  end
end
