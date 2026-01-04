require 'rails_helper'
describe Admin::SystemRolesController, type: :controller do
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
      system_role = create(:system_role)
      get :show, params: { id: system_role.id }

      expect(response).to have_http_status(:ok)
    end

    it 'responds successfully to new' do
      get :new

      expect(response).to have_http_status(:ok)
    end

    it 'responds successfully to edit' do
      system_role = create(:system_role)
      get :edit, params: { id: system_role.id }

      expect(response).to have_http_status(:ok)
    end

    it 'creates a system_role and redirects' do
      system_role_params = {
        name: 'Test Role',
        abbreviation: 'TST',
        description: 'Test role description',
        notes: 'Test notes'
      }

      expect {
        post :create, params: { system_role: system_role_params }
      }.to change(SystemRole, :count).by(1)

      expect(response).to have_http_status(:redirect)
      expect(flash[:success]).to be_present
    end

    it 'updates a system_role and redirects' do
      system_role = create(:system_role)
      updated_params = { name: 'Updated Role' }

      patch :update, params: { id: system_role.id, system_role: updated_params }

      expect(response).to have_http_status(:redirect)
      expect(flash[:success]).to be_present
      expect(system_role.reload.name).to eq('Updated Role')
    end

    it 'destroys a system_role and redirects' do
      system_role = create(:system_role)

      expect {
        delete :destroy, params: { id: system_role.id }
      }.to change(SystemRole, :count).by(-1)

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
      system_role = create(:system_role)
      get :show, params: { id: system_role.id }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for new' do
      get :new

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for edit' do
      system_role = create(:system_role)
      get :edit, params: { id: system_role.id }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for create' do
      post :create, params: { system_role: { name: 'Test Role' } }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for update' do
      system_role = create(:system_role)
      patch :update, params: { id: system_role.id, system_role: { name: 'Updated' } }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for destroy' do
      system_role = create(:system_role)
      delete :destroy, params: { id: system_role.id }

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
      system_role = create(:system_role)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      get :show, params: { id: system_role.id }

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
      system_role = create(:system_role)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      get :edit, params: { id: system_role.id }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for create' do
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      post :create, params: { system_role: { name: 'Test Role' } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for update' do
      system_role = create(:system_role)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      patch :update, params: { id: system_role.id, system_role: { name: 'Updated' } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for destroy' do
      system_role = create(:system_role)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      delete :destroy, params: { id: system_role.id }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end
  end
end
