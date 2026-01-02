require 'rails_helper'

describe Admin::UsersController, type: :controller do
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
      user = create(:user)
      get :show, params: { id: user.id }

      expect(response).to have_http_status(:ok)
    end

    it 'responds successfully to new' do
      get :new

      expect(response).to have_http_status(:ok)
    end

    it 'responds successfully to edit' do
      user = create(:user)
      get :edit, params: { id: user.id }

      expect(response).to have_http_status(:ok)
    end

    it 'creates a user and redirects' do
      user_params = { 
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      }

      expect {
        post :create, params: { user: user_params }
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:redirect)
      expect(flash[:success]).to be_present
    end

    it 'updates a user and redirects' do
      user = create(:user)
      updated_params = { first_name: 'Updated' }

      patch :update, params: { id: user.id, user: updated_params }

      expect(response).to have_http_status(:redirect)
      expect(flash[:success]).to be_present
      expect(user.reload.first_name).to eq('Updated')
    end

    it 'destroys a user and redirects' do
      user = create(:user)

      delete :destroy, params: { id: user.id }

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
      user = create(:user)
      get :show, params: { id: user.id }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for new' do
      get :new

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for edit' do
      user = create(:user)
      get :edit, params: { id: user.id }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for create' do
      post :create, params: { user: { email: 'test@example.com' } }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for update' do
      user = create(:user)
      patch :update, params: { id: user.id, user: { first_name: 'Updated' } }

      expect(response).to redirect_to(new_user_session_path)
    end

    it 'redirects to sign in for destroy' do
      user = create(:user)
      delete :destroy, params: { id: user.id }

      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context 'when authenticated but unauthorized' do
    before do
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end
    end

    it 'returns unauthorized status via the Pundit handler for index' do
      get :index

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for show' do
      user = create(:user)

      get :show, params: { id: user.id }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for new' do
      get :new

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for edit' do
      user = create(:user)

      get :edit, params: { id: user.id }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for create' do
      post :create, params: { user: { email: 'test@example.com' } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for update' do
      user = create(:user)

      patch :update, params: { id: user.id, user: { first_name: 'Updated' } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end

    it 'returns unauthorized status via the Pundit handler for destroy' do
      user = create(:user)

      delete :destroy, params: { id: user.id }

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end
  end
end
