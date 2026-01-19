require "rails_helper"

RSpec.describe Admin::NotificationSubscriptionsController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/notification_subscriptions" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
      end

      it "responds successfully to index" do
        get admin_notification_subscriptions_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        subscription = create(:notification_subscription)

        get admin_notification_subscription_path(subscription)

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to new" do
        get new_admin_notification_subscription_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to edit" do
        subscription = create(:notification_subscription)

        get edit_admin_notification_subscription_path(subscription)

        expect(response).to have_http_status(:ok)
      end

      it "creates a notification subscription and redirects" do
        topic = create(:notification_topic)
        subscriber = create(:user)
        subscription_params = {
          notification_topic_id: topic.id,
          user_id: subscriber.id,
          distribution_method: "email",
          distribution_frequency: "immediate",
          active: true
        }

        expect do
          post admin_notification_subscriptions_path, params: { notification_subscription: subscription_params }
        end.to change(NotificationSubscription, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
      end

      it "updates a notification subscription and redirects" do
        subscription = create(:notification_subscription)
        updated_params = { distribution_frequency: "summarized_hourly" }

        patch admin_notification_subscription_path(subscription), params: { notification_subscription: updated_params }

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
        expect(subscription.reload.distribution_frequency).to eq("summarized_hourly")
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_notification_subscriptions_path

        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end
end
