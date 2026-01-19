require "rails_helper"

RSpec.describe Admin::NotificationTopicsController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/notification_topics" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
      end

      it "responds successfully to index" do
        get admin_notification_topics_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        topic = create(:notification_topic)

        get admin_notification_topic_path(topic)

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to new" do
        get new_admin_notification_topic_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to edit" do
        topic = create(:notification_topic)

        get edit_admin_notification_topic_path(topic)

        expect(response).to have_http_status(:ok)
      end

      it "creates a notification topic and redirects" do
        topic_params = {
          name: "Test Topic",
          key: "test.topic",
          description: "Test description"
        }

        expect do
          post admin_notification_topics_path, params: { notification_topic: topic_params }
        end.to change(NotificationTopic, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
      end

      it "updates a notification topic and redirects" do
        topic = create(:notification_topic)
        updated_params = { name: "Updated Topic" }

        patch admin_notification_topic_path(topic), params: { notification_topic: updated_params }

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
        expect(topic.reload.name).to eq("Updated Topic")
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_notification_topics_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for show" do
        topic = create(:notification_topic)

        get admin_notification_topic_path(topic)

        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end
end
