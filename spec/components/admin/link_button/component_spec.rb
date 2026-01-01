require 'rails_helper'

describe Admin::LinkButton::Component, type: :component do
  let(:user) { create(:user) }

  before { sign_in(user) }

  it 'renders a link with text, path, and classes' do
    render_inline(described_class.new(path: '/admin/widgets', text: 'Back', button_classes: 'btn btn-secondary'))

    expect(page).to have_link('Back', href: '/admin/widgets')
    expect(page).to have_css('a.btn.btn-secondary')
  end

  it 'does not render when marked non-public' do
    render_inline(described_class.new(path: '/admin/widgets', text: 'Hidden', public: false))

    expect(page).not_to have_link('Hidden')
  end
end
