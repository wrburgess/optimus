require 'rails_helper'

RSpec.describe Admin::UsersController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/users" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
        User.class_eval { attr_accessor :notes } unless User.method_defined?(:notes)
      end

      it "responds successfully to index" do
        get admin_users_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        target_user = create(:user)

        get admin_user_path(target_user)

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to new" do
        get new_admin_user_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to edit" do
        target_user = create(:user)

        get edit_admin_user_path(target_user)

        expect(response).to have_http_status(:ok)
      end

      it "creates a user and redirects" do
        user_params = {
          email: "test@example.com",
          first_name: "Test",
          last_name: "User"
        }

        expect do
          post admin_users_path, params: { user: user_params }
        end.to change(User, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
      end

      it "updates a user and redirects" do
        target_user = create(:user)
        updated_params = { first_name: "Updated" }

        patch admin_user_path(target_user), params: { user: updated_params }

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
        expect(target_user.reload.first_name).to eq("Updated")
      end

      it "destroys a user and redirects" do
        target_user = create(:user)

        delete admin_user_path(target_user)

        expect(response).to have_http_status(:redirect)
        expect(flash[:danger]).to be_present
        expect(target_user.reload.archived_at).to be_present
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_users_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for show" do
        target_user = create(:user)

        get admin_user_path(target_user)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for new" do
        get new_admin_user_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for edit" do
        target_user = create(:user)

        get edit_admin_user_path(target_user)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for create" do
        post admin_users_path, params: { user: { email: "test@example.com" } }

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for update" do
        target_user = create(:user)

        patch admin_user_path(target_user), params: { user: { first_name: "Updated" } }

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for destroy" do
        target_user = create(:user)

        delete admin_user_path(target_user)

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
        get admin_users_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for show" do
        target_user = create(:user)

        get admin_user_path(target_user)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for new" do
        get new_admin_user_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for edit" do
        target_user = create(:user)

        get edit_admin_user_path(target_user)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for create" do
        post admin_users_path, params: { user: { email: "test@example.com" } }

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for update" do
        target_user = create(:user)

        patch admin_user_path(target_user), params: { user: { first_name: "Updated" } }

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for destroy" do
        target_user = create(:user)

        delete admin_user_path(target_user)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end
    end
  end
end
