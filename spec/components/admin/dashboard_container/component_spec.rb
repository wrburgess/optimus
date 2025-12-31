require 'rails_helper'

describe Admin::DashboardContainer::Component, type: :component do
  let(:user) { create(:user) }

  before do
    sign_in(user)
  end

  it 'renders content within a container with default styles' do
    render_inline(described_class.new) do
      'Dashboard content'
    end

    container = page.find('div.container-fluid.py-3')
    expect(container).to have_text('Dashboard content')
    expect(container[:data]).to be_nil.or eq('')
  end

  it 'applies provided stimulus data attributes' do
    render_inline(described_class.new(stimulus_controller: 'charts', stimulus_target: 'container')) do
      'Dashboard content'
    end

    container = page.find('div[data-controller="charts"]')
    expect(container['data-charts-target']).to eq('container')
  end
end
