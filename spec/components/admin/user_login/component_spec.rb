require 'rails_helper'

describe Admin::UserLogin::Component, type: :component do
  let(:user) { create(:user) }

  before { sign_in(user) }

  it 'renders a support and Sign Out link if user signed in' do
    component = described_class.new(user_signed_in: true)
    render_inline(component)

    expect(page).to have_text('Sign out')
  end

  it 'renders a support and Login link if user not signed in' do
    component = described_class.new(user_signed_in: false)
    render_inline(component)

    expect(page).to have_text('Login')
  end
end
