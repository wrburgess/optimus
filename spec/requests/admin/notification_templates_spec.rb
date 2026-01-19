require "rails_helper"

RSpec.describe Admin::NotificationTemplatesController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/notification_templates" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
      end

      it "responds successfully to index" do
        get admin_notification_templates_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        template = create(:notification_template)

        get admin_notification_template_path(template)

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to new" do
        get new_admin_notification_template_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to edit" do
        template = create(:notification_template)

        get edit_admin_notification_template_path(template)

        expect(response).to have_http_status(:ok)
      end

      it "creates a notification template and redirects" do
        topic = create(:notification_topic)
        template_params = {
          notification_topic_id: topic.id,
          distribution_method: "email",
          subject_template: "Test Subject",
          body_template: "Test Body",
          active: true
        }

        expect do
          post admin_notification_templates_path, params: { notification_template: template_params }
        end.to change(NotificationTemplate, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
      end

      it "updates a notification template and redirects" do
        template = create(:notification_template)
        updated_params = { subject_template: "Updated Subject" }

        patch admin_notification_template_path(template), params: { notification_template: updated_params }

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
        expect(template.reload.subject_template).to eq("Updated Subject")
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_notification_templates_path

        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end
end
