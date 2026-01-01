require 'rails_helper'

describe Admin::PageContainer::Component, type: :component do
  let(:user) { create(:user) }

  before do
    sign_in(user)
  end

  it 'wraps content in a padded fluid container' do
    render_inline(described_class.new) do
      'Page content'
    end

    container = page.find('div.container-fluid.py-3')
    expect(container).to have_text('Page content')
    expect(container[:data]).to be_nil.or eq('')
  end

  it 'adds stimulus controller and target attributes when provided' do
    render_inline(described_class.new(stimulus_controller: 'pages', stimulus_target: 'section')) do
      'Stimulus content'
    end

    container = page.find('div[data-controller="pages"]')
    expect(container['data-pages-target']).to eq('section')
  end
end
