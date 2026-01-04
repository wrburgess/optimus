require 'rails_helper'
describe Admin::SystemPermissionsController, type: :controller do
  login_user

  context 'when authenticated and authorized' do
    before do
      allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
    end

    it 'responds successfully to index' do
      get :index

      expect(response).to have_http_status(:ok)
    end

    it 'responds successfully to show' do
      system_permission = create(:system_permission)
      get :show, params: { id: system_permission.id }

      expect(response).to have_http_status(:ok)
    end

    it 'responds successfully to new' do
      get :new

      expect(response).to have_http_status(:ok)
    end

    it 'responds successfully to edit' do
      system_permission = create(:system_permission)
      get :edit, params: { id: system_permission.id }

      expect(response).to have_http_status(:ok)
    end

    it 'creates a system permission and redirects' do
      system_permission_params = {
        name: 'Test Permission',
        abbreviation: 'TP',
        resource: 'test_resource',
        operation: 'test_operation',
        description: 'Test description'
      }

      expect {
        post :create, params: { system_permission: system_permission_params }
      }.to change(SystemPermission, :count).by(1)

      expect(response).to have_http_status(:redirect)
      expect(flash[:success]).to be_present
    end

    it 'updates a system permission and redirects' do
      system_permission = create(:system_permission)
      updated_params = { name: 'Updated Permission' }

      patch :update, params: { id: system_permission.id, system_permission: updated_params }

      expect(response).to have_http_status(:redirect)
      expect(flash[:success]).to be_present
      expect(system_permission.reload.name).to eq('Updated Permission')
    end

    it 'destroys a system permission and redirects' do
      system_permission = create(:system_permission)

      expect {
        delete :destroy, params: { id: system_permission.id }
      }.to change(SystemPermission, :count).by(-1)

      expect(response).to have_http_status(:redirect)
      expect(flash[:danger]).to be_present
    end
  end

  context 'when not authenticated' do
    before { sign_out @current_user }

    it 'redirects to sign in for index' do
      get :index

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for show' do
      system_permission = create(:system_permission)
      get :show, params: { id: system_permission.id }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for new' do
      get :new

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for edit' do
      system_permission = create(:system_permission)
      get :edit, params: { id: system_permission.id }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for create' do
      post :create, params: { system_permission: { name: 'Test Permission' } }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for update' do
      system_permission = create(:system_permission)
      patch :update, params: { id: system_permission.id, system_permission: { name: 'Updated' } }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for destroy' do
      system_permission = create(:system_permission)
      delete :destroy, params: { id: system_permission.id }

      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context 'when authenticated but unauthorized' do
    it 'returns unauthorized status via the Pundit handler for index' do
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      get :index

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for show' do
      system_permission = create(:system_permission)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      get :show, params: { id: system_permission.id }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for new' do
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      get :new

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for edit' do
      system_permission = create(:system_permission)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      get :edit, params: { id: system_permission.id }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for create' do
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      post :create, params: { system_permission: { name: 'Test Permission' } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for update' do
      system_permission = create(:system_permission)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      patch :update, params: { id: system_permission.id, system_permission: { name: 'Updated' } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for destroy' do
      system_permission = create(:system_permission)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      delete :destroy, params: { id: system_permission.id }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end
  end
end
