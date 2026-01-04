require 'rails_helper'

RSpec.describe Admin::SystemGroupsController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  describe "GET /admin/system_groups" do
    context "when authenticated and authorized" do
      before do
        login_as(user, scope: :user)
        allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
      end

      it "responds successfully to index" do
        get admin_system_groups_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to show" do
        system_group = create(:system_group)

        get admin_system_group_path(system_group)

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to new" do
        get new_admin_system_group_path

        expect(response).to have_http_status(:ok)
      end

      it "responds successfully to edit" do
        system_group = create(:system_group)

        get edit_admin_system_group_path(system_group)

        expect(response).to have_http_status(:ok)
      end

      it "creates a system group and redirects" do
        system_group_params = {
          name: "Test Group",
          abbreviation: "TG01",
          description: "Test group description",
          notes: "Test notes"
        }

        expect do
          post admin_system_groups_path, params: { system_group: system_group_params }
        end.to change(SystemGroup, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
      end

      it "updates a system group and redirects" do
        system_group = create(:system_group)
        updated_params = { name: "Updated Group" }

        patch admin_system_group_path(system_group), params: { system_group: updated_params }

        expect(response).to have_http_status(:redirect)
        expect(flash[:success]).to be_present
        expect(system_group.reload.name).to eq("Updated Group")
      end

      it "destroys a system group and redirects" do
        system_group = create(:system_group)

        delete admin_system_group_path(system_group)

        expect(response).to have_http_status(:redirect)
        expect(flash[:danger]).to be_present
        expect { system_group.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "when not authenticated" do
      it "redirects to sign in for index" do
        get admin_system_groups_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for show" do
        system_group = create(:system_group)

        get admin_system_group_path(system_group)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for new" do
        get new_admin_system_group_path

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for edit" do
        system_group = create(:system_group)

        get edit_admin_system_group_path(system_group)

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for create" do
        post admin_system_groups_path, params: { system_group: { name: "Test Group" } }

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for update" do
        system_group = create(:system_group)

        patch admin_system_group_path(system_group), params: { system_group: { name: "Updated" } }

        expect(response).to redirect_to(new_user_session_path)
      end

      it "redirects to sign in for destroy" do
        system_group = create(:system_group)

        delete admin_system_group_path(system_group)

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
        get admin_system_groups_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for show" do
        system_group = create(:system_group)

        get admin_system_group_path(system_group)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for new" do
        get new_admin_system_group_path

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for edit" do
        system_group = create(:system_group)

        get edit_admin_system_group_path(system_group)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for create" do
        post admin_system_groups_path, params: { system_group: { name: "Test Group" } }

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for update" do
        system_group = create(:system_group)

        patch admin_system_group_path(system_group), params: { system_group: { name: "Updated" } }

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end

      it "returns unauthorized status via the Pundit handler for destroy" do
        system_group = create(:system_group)

        delete admin_system_group_path(system_group)

        expect(response).to have_http_status(:unauthorized)
        expect(response.body).to include("unauthorized")
      end
    end
  end
end
