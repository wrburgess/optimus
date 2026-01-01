require 'rails_helper'

describe Admin::IndexPager::Component, type: :component do
  let(:user) { create(:user) }
  let(:pagy) do
    double('Pagy', from: 1, to: 10, count: 20, series_nav: '<nav class="pagy-nav">1</nav>'.html_safe)
  end
  let(:instance) do
    Class.new do
      def self.name = 'Widget'
    end.new
  end

  before { sign_in(user) }

  it 'renders pagination summary and nav when data present' do
    render_inline(described_class.new(pagy:, instance:))

    expect(page).to have_css('nav.pagy-nav')
    expect(page).to have_text('Displaying Widgets 1 to 10 of 20 in total')
  end

  it 'does not render when pagy is missing' do
    render_inline(described_class.new(pagy: nil, instance:))

    expect(page).to have_no_css('nav.pagy-nav')
  end
end
