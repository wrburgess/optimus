require 'rails_helper'

RSpec.describe Admin::SystemRolesController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/system_roles" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
        SystemRole.class_eval { attr_accessor :system_group_ids, :system_permission_ids } unless SystemRole.method_defined?(:system_group_ids)
      end

      it "responds successfully to index" do
        get admin_system_roles_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        system_role = create(:system_role)

        get admin_system_role_path(system_role)

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to new" do
        get new_admin_system_role_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to edit" do
        system_role = create(:system_role)

        get edit_admin_system_role_path(system_role)

        expect(response).to have_http_status(:ok)
      end

      it "creates a system_role and redirects" do
        system_role_params = {
          name: "Test Role",
          abbreviation: "TST",
          description: "Test role description",
          notes: "Test notes"
        }

        expect do
          post admin_system_roles_path, params: { system_role: system_role_params }
        end.to change(SystemRole, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
      end

      it "updates a system_role and redirects" do
        system_role = create(:system_role)
        updated_params = { name: "Updated Role" }

        patch admin_system_role_path(system_role), params: { system_role: updated_params }

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
        expect(system_role.reload.name).to eq("Updated Role")
      end

      it "destroys a system_role and redirects" do
        system_role = create(:system_role)

        expect do
          delete admin_system_role_path(system_role)
        end.to change(SystemRole, :count).by(-1)

        expect(response).to have_http_status(:redirect)
        expect(flash[:danger]).to be_present
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_system_roles_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for show" do
        system_role = create(:system_role)

        get admin_system_role_path(system_role)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for new" do
        get new_admin_system_role_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for edit" do
        system_role = create(:system_role)

        get edit_admin_system_role_path(system_role)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for create" do
        post admin_system_roles_path, params: { system_role: { name: "Test Role" } }

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for update" do
        system_role = create(:system_role)

        patch admin_system_role_path(system_role), params: { system_role: { name: "Updated" } }

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for destroy" do
        system_role = create(:system_role)

        delete admin_system_role_path(system_role)

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
        get admin_system_roles_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for show" do
        system_role = create(:system_role)

        get admin_system_role_path(system_role)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for new" do
        get new_admin_system_role_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for edit" do
        system_role = create(:system_role)

        get edit_admin_system_role_path(system_role)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for create" do
        post admin_system_roles_path, params: { system_role: { name: "Test Role" } }

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for update" do
        system_role = create(:system_role)

        patch admin_system_role_path(system_role), params: { system_role: { name: "Updated" } }

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for destroy" do
        system_role = create(:system_role)

        delete admin_system_role_path(system_role)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end
    end
  end
end
