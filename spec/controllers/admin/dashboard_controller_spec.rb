require 'rails_helper'
describe Admin::DashboardController, type: :controller do
  login_user

  context 'when authenticated and authorized' do
    before do
      allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
    end

    it 'responds successfully to index' do
      get :index

      expect(response).to have_http_status(:ok)
    end
  end

  context 'when not authenticated' do
    before { sign_out @current_user }

    it 'redirects to sign in' do
      get :index

      expect(response).to redirect_to(new_user_session_path)
    end
  end

  context 'when authenticated but unauthorized' do
    it 'returns unauthorized status via the Pundit handler' do
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: 'unauthorized', status: :unauthorized)
      end

      get :index

      expect(response).to have_http_status(:unauthorized)
      expect(response.body).to include('unauthorized')
    end
  end
end
