require 'rails_helper'

describe Admin::ActionButton::Component, type: :component do
  describe '#render' do
    let(:user) { create(:user) }

    before do
      sign_in(user)
    end

    it 'renders a cancel_to_index action button' do
      component = described_class.new(operation: :cancel_to_index, instance: user, public: true)
      render_inline(component)

      expect(page).to have_text('Cancel')
      expect(page).to have_link(nil, href: '/admin/users')
      expect(page).to have_css('.btn-secondary')
      expect(page).to have_css('.bi-x-octagon')

      link = page.find('a', text: 'Cancel')
      method_attribute = link['data-turbo-method']

      expect(method_attribute).to eq('get')
    end

    it 'renders a cancel_to_show action button' do
      component = described_class.new(operation: :cancel_to_show, instance: user, public: true)
      render_inline(component)

      expect(page).to have_text('Cancel')
    end
  end
end
