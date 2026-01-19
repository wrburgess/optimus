require "rails_helper"

RSpec.describe Admin::NotificationMessagesController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/notification_messages" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
      end

      it "responds successfully to index" do
        get admin_notification_messages_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        message = create(:notification_message)

        get admin_notification_message_path(message)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_notification_messages_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for show" do
        message = create(:notification_message)

        get admin_notification_message_path(message)

        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end
end
