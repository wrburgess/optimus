require 'rails_helper'
describe Admin::DashboardController, type: :controller do
  login_user

  before do
    allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
  end

  it 'responds successfully to index' do
    get :index

    expect(response).to have_http_status(:ok)
  end
end
