require 'rails_helper'

describe Admin::InterfaceNotification::Component, type: :component do
  let(:user) { create(:user) }

  before { sign_in(user) }

  it 'renders flash messages with type-based alerts' do
    flash = { success: 'Saved successfully', danger: 'Error occurred' }.with_indifferent_access
    allow_any_instance_of(described_class).to receive(:flash).and_return(flash)

    render_inline(described_class.new(flash:))

    expect(page).to have_css('.alert.alert-success', text: /Saved successfully/)
    expect(page).to have_css('.alert.alert-danger', text: /Error occurred/)
  end

  it 'does not render when flash is empty' do
    allow_any_instance_of(described_class).to receive(:flash).and_return({})

    render_inline(described_class.new(flash: {}))

    expect(page).not_to have_css('.alert')
  end
end
