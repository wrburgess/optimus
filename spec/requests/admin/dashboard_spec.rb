require 'rails_helper'

RSpec.describe "Admin::Dashboard", type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(Admin::DashboardController).to receive(:authorize).and_return(true)
      end

      it "responds successfully to index" do
        get admin_root_path

        expect(response).to have_http_status(:ok)
      end
    end

    context "when not authenticated" do
      it "redirects to sign in" do
        get admin_root_path

        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context "when authenticated but unauthorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(Admin::DashboardController).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
        allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
          controller.render(plain: "unauthorized", status: :unauthorized)
        end
      end

      it "returns unauthorized status via the Pundit handler" do
        get admin_root_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end
    end
  end
end
