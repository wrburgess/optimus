require 'rails_helper'

RSpec.describe Admin::DataLogsController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/data_logs" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
      end

      it "responds successfully to index" do
        get admin_data_logs_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        data_log = create(:data_log)

        get admin_data_log_path(data_log)

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to collection_export_xlsx" do
        create(:data_log)

        get export_xlsx_admin_data_logs_path

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_data_logs_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for show" do
        data_log = create(:data_log)

        get admin_data_log_path(data_log)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for collection_export_xlsx" do
        get export_xlsx_admin_data_logs_path

        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context "when authenticated but unauthorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
        allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
          controller.render(plain: "unauthorized", status: :unauthorized)
        end
      end

      it "returns unauthorized status via the Pundit handler for index" do
        get admin_data_logs_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for show" do
        data_log = create(:data_log)

        get admin_data_log_path(data_log)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for collection_export_xlsx" do
        get export_xlsx_admin_data_logs_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end
    end
  end
end
