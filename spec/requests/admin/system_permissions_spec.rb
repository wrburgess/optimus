require 'rails_helper'

RSpec.describe Admin::SystemPermissionsController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/system_permissions" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
      end

      it "responds successfully to index" do
        get admin_system_permissions_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        system_permission = create(:system_permission)

        get admin_system_permission_path(system_permission)

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to new" do
        get new_admin_system_permission_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to edit" do
        system_permission = create(:system_permission)

        get edit_admin_system_permission_path(system_permission)

        expect(response).to have_http_status(:ok)
      end

      it "creates a system permission and redirects" do
        system_permission_params = {
          name: "Test Permission",
          abbreviation: "TP01",
          description: "Test permission description",
          notes: "Test notes",
          resource: "test_resource",
          operation: "test_operation"
        }

        expect do
          post admin_system_permissions_path, params: { system_permission: system_permission_params }
        end.to change(SystemPermission, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
      end

      it "updates a system permission and redirects" do
        system_permission = create(:system_permission)
        updated_params = { name: "Updated Permission" }

        patch admin_system_permission_path(system_permission), params: { system_permission: updated_params }

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
        expect(system_permission.reload.name).to eq("Updated Permission")
      end

      it "destroys a system permission and redirects" do
        system_permission = create(:system_permission)

        delete admin_system_permission_path(system_permission)

        expect(response).to have_http_status(:redirect)
        expect(flash[:danger]).to be_present
        expect { system_permission.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_system_permissions_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for show" do
        system_permission = create(:system_permission)

        get admin_system_permission_path(system_permission)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for new" do
        get new_admin_system_permission_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for edit" do
        system_permission = create(:system_permission)

        get edit_admin_system_permission_path(system_permission)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for create" do
        post admin_system_permissions_path, params: { system_permission: { name: "Test Permission" } }

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for update" do
        system_permission = create(:system_permission)

        patch admin_system_permission_path(system_permission), params: { system_permission: { name: "Updated" } }

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for destroy" do
        system_permission = create(:system_permission)

        delete admin_system_permission_path(system_permission)

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
        get admin_system_permissions_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for show" do
        system_permission = create(:system_permission)

        get admin_system_permission_path(system_permission)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for new" do
        get new_admin_system_permission_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for edit" do
        system_permission = create(:system_permission)

        get edit_admin_system_permission_path(system_permission)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for create" do
        post admin_system_permissions_path, params: { system_permission: { name: "Test Permission" } }

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for update" do
        system_permission = create(:system_permission)

        patch admin_system_permission_path(system_permission), params: { system_permission: { name: "Updated" } }

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for destroy" do
        system_permission = create(:system_permission)

        delete admin_system_permission_path(system_permission)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end
    end
  end
end
