require "rails_helper"

RSpec.describe "Notification Integration", type: :request do
  let(:admin_user) { create(:user, confirmed_at: Time.current) }
  let!(:topic) { create(:notification_topic, key: "user.created") }
  let!(:template) do
    create(:notification_template,
      notification_topic: topic,
      distribution_method: "email",
      subject_template: "New User Created: <%= user.full_name %>",
      body_template: "A new user <%= user.full_name %> was created by <%= created_by.full_name %>.")
  end
  let!(:subscription) do
    create(:notification_subscription,
      notification_topic: topic,
      user: admin_user,
      distribution_method: "email",
      distribution_frequency: "immediate",
      active: true)
  end

  before do
    login_as(admin_user, scope: :user)
    allow_any_instance_of(Admin::UsersController).to receive(:authorize).and_return(true)
  end

  describe "user creation notification flow" do
    it "creates notification message and queue item when user is created" do
      user_params = {
        email: "newuser@example.com",
        first_name: "New",
        last_name: "User"
      }

      expect do
        post admin_users_path, params: { user: user_params }
      end.to change(User, :count).by(1)
         .and have_enqueued_job(NotifyTopicJob)
    end

    it "processes the full notification pipeline" do
      user_params = {
        email: "testuser@example.com",
        first_name: "Test",
        last_name: "User"
      }

      perform_enqueued_jobs do
        post admin_users_path, params: { user: user_params }
      end

      # Verify a notification message was created
      message = NotificationMessage.last
      expect(message).to be_present
      expect(message.notification_topic).to eq(topic)
      expect(message.subject).to include("Test User")

      # Verify a queue item was created
      queue_item = NotificationQueueItem.last
      expect(queue_item).to be_present
      expect(queue_item.user).to eq(admin_user)
      expect(queue_item.distribution_method).to eq("email")

      # Verify the email was sent
      expect(ActionMailer::Base.deliveries.count).to be >= 1
    end
  end

  describe "notification delivery" do
    it "sends email immediately for immediate subscriptions" do
      user_params = {
        email: "immediate@example.com",
        first_name: "Immediate",
        last_name: "Test"
      }

      perform_enqueued_jobs do
        post admin_users_path, params: { user: user_params }
      end

      queue_item = NotificationQueueItem.last
      expect(queue_item.distributed?).to be true
    end

    it "does not send immediately for hourly subscriptions" do
      subscription.update!(distribution_frequency: "summarized_hourly")

      user_params = {
        email: "hourly@example.com",
        first_name: "Hourly",
        last_name: "Test"
      }

      # Run without processing summarized notifications
      perform_enqueued_jobs(only: [ NotifyTopicJob, ProcessImmediateNotificationsJob, DistributeNotificationJob ]) do
        post admin_users_path, params: { user: user_params }
      end

      queue_item = NotificationQueueItem.last
      expect(queue_item.distributed?).to be false
      expect(queue_item.distribute_at).to be > Time.current
    end
  end

  describe "template rendering" do
    it "renders templates with the provided context" do
      user_params = {
        email: "template@example.com",
        first_name: "Template",
        last_name: "Test"
      }

      perform_enqueued_jobs do
        post admin_users_path, params: { user: user_params }
      end

      message = NotificationMessage.last
      expect(message.subject).to eq("New User Created: Template Test")
      expect(message.body).to include("Template Test")
      expect(message.body).to include(admin_user.full_name)
    end
  end
end
