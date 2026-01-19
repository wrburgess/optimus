require "rails_helper"

RSpec.describe NotifyTopicJob, type: :job do
  let(:user) { create(:user) }
  let(:topic) { create(:notification_topic, key: "test.topic") }
  let(:template) do
    create(:notification_template,
      notification_topic: topic,
      distribution_method: "email",
      subject_template: "Hello <%= user.full_name %>",
      body_template: "This is a test notification for <%= user.email %>")
  end
  let(:subscription) do
    create(:notification_subscription,
      notification_topic: topic,
      user: user,
      distribution_method: "email",
      distribution_frequency: "immediate")
  end

  before do
    template
    subscription
  end

  describe "#perform" do
    it "creates a notification message" do
      expect do
        described_class.perform_now(
          topic_key: "test.topic",
          context: { "user" => { "_class" => "User", "_id" => user.id } }
        )
      end.to change(NotificationMessage, :count).by(1)
    end

    it "creates a notification queue item for each subscription" do
      expect do
        described_class.perform_now(
          topic_key: "test.topic",
          context: { "user" => { "_class" => "User", "_id" => user.id } }
        )
      end.to change(NotificationQueueItem, :count).by(1)
    end

    it "renders the template with the given context" do
      described_class.perform_now(
        topic_key: "test.topic",
        context: { "user" => { "_class" => "User", "_id" => user.id } }
      )

      message = NotificationMessage.last
      expect(message.subject).to eq("Hello #{user.full_name}")
      expect(message.body).to eq("This is a test notification for #{user.email}")
    end

    it "enqueues ProcessImmediateNotificationsJob" do
      expect do
        described_class.perform_now(
          topic_key: "test.topic",
          context: { "user" => { "_class" => "User", "_id" => user.id } }
        )
      end.to have_enqueued_job(ProcessImmediateNotificationsJob)
    end

    it "sets distribute_at to current time for immediate subscriptions" do
      freeze_time do
        described_class.perform_now(
          topic_key: "test.topic",
          context: { "user" => { "_class" => "User", "_id" => user.id } }
        )

        item = NotificationQueueItem.last
        expect(item.distribute_at).to eq(Time.current)
      end
    end

    context "with hourly subscription" do
      let(:subscription) do
        create(:notification_subscription,
          notification_topic: topic,
          user: user,
          distribution_method: "email",
          distribution_frequency: "summarized_hourly")
      end

      it "sets distribute_at to next hour" do
        travel_to(Time.zone.parse("2026-01-19 10:30:00")) do
          described_class.perform_now(
            topic_key: "test.topic",
            context: { "user" => { "_class" => "User", "_id" => user.id } }
          )

          item = NotificationQueueItem.last
          expect(item.distribute_at).to eq(Time.zone.parse("2026-01-19 11:00:00"))
        end
      end
    end

    context "with daily subscription" do
      let(:subscription) do
        create(:notification_subscription,
          notification_topic: topic,
          user: user,
          distribution_method: "email",
          distribution_frequency: "summarized_daily",
          summarized_daily_hour: 9)
      end

      it "sets distribute_at to next occurrence of the daily hour" do
        travel_to(Time.zone.parse("2026-01-19 08:00:00")) do
          described_class.perform_now(
            topic_key: "test.topic",
            context: { "user" => { "_class" => "User", "_id" => user.id } }
          )

          item = NotificationQueueItem.last
          expect(item.distribute_at.hour).to eq(9)
        end
      end
    end

    it "does nothing when no subscriptions exist" do
      NotificationSubscription.destroy_all

      expect do
        described_class.perform_now(
          topic_key: "test.topic",
          context: { "user" => { "_class" => "User", "_id" => user.id } }
        )
      end.not_to change(NotificationMessage, :count)
    end

    it "does nothing when no template exists for the method" do
      NotificationTemplate.destroy_all

      expect do
        described_class.perform_now(
          topic_key: "test.topic",
          context: { "user" => { "_class" => "User", "_id" => user.id } }
        )
      end.not_to change(NotificationMessage, :count)
    end

    it "raises error when topic is not found" do
      expect do
        described_class.perform_now(
          topic_key: "nonexistent.topic",
          context: {}
        )
      end.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
