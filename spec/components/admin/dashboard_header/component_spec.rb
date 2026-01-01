require 'rails_helper'

describe Admin::DashboardHeader::Component, type: :component do
  let(:user) { create(:user) }

  before do
    sign_in(user)
  end

  it 'renders the title, breadcrumbs, and page links' do
    render_inline(
      described_class.new(
        title: 'Dashboard',
        q: double('ransack', conditions: []),
        show_filtering: true
      )
    ) do |component|
      component.with_breadcrumb(name: 'Home', url: '/')
      component.with_page_link(name: 'New Item', url: '/admin/items/new')
    end

    expect(page).to have_css('h2 .fw-bold', text: 'Dashboard')
    expect(page).to have_link('Home', href: '/')
    expect(page).to have_link('New Item', href: '/admin/items/new')
    expect(page).to have_css('a[data-bs-target="#filters"]')
  end

  it 'shows the filter indicator when query has conditions' do
    q = double('ransack', conditions: [ double ], archived_at_not_null: true)

    render_inline(described_class.new(title: 'Dashboard', q:, show_filtering: false))

    expect(page).to have_css('i[title="Results are filtered"]')
  end

  it 'hides the filter indicator when query has no conditions' do
    q = double('ransack', conditions: [])

    render_inline(described_class.new(title: 'Dashboard', q:))

    expect(page).not_to have_css('i[title="Results are filtered"]')
  end
end
