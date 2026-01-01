require 'rails_helper'

describe Admin::FormButton::Component, type: :component do
  let(:user) { create(:user) }

  before do
    sign_in(user)
  end

  it 'renders a submit button with default text, classes, and icon' do
    render_inline(described_class.new(operation: :submit))

    button = page.find('button')
    expect(button[:class]).to include('btn btn-success')
    expect(button).to have_text('Submit')
    expect(page).to have_css('i.bi.bi-check-circle')
  end

  it 'renders a filter button with custom text, classes, and icon' do
    render_inline(
      described_class.new(
        operation: :filter,
        text: 'Run Filters',
        button_classes: 'btn btn-primary',
        classes_append: 'w-100',
        icon_classes: 'bi bi-stars'
      )
    )

    button = page.find('button')
    expect(button[:class]).to include('btn btn-primary')
    expect(button[:class]).to include('w-100')
    expect(button).to have_text('Run Filters')
    expect(page).to have_css('i.bi.bi-stars')
  end

  it 'renders nothing when marked non-public' do
    render_inline(described_class.new(operation: :submit, public: false))

    expect(page).not_to have_css('button')
  end
end
