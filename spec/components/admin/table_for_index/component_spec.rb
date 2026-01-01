require 'rails_helper'

describe Admin::TableForIndex::Component, type: :component do
  let(:user) { create(:user) }
  let(:records) do
    [
      Struct.new(:id, :name, :status).new(1, 'Alpha', 'Active'),
      Struct.new(:id, :name, :status).new(2, 'Beta', 'Pending')
    ]
  end

  before do
    sign_in(user)
  end

  it 'renders the title, column headers, and row cells' do
    render_inline(described_class.new(data: records, title: 'Users')) do |component|
      component.with_column('Name') { |record| record.name }
      component.with_column('Status') { |record| record.status }
    end

    expect(page).to have_css('h4.title-header', text: 'Users')
    expect(page).to have_css('thead th', text: 'Name')
    expect(page).to have_css('thead th', text: 'Status')

    body_rows = page.all('table tr')[1..]
    expect(body_rows.size).to eq(2)
    expect(body_rows.first).to have_text('Alpha')
    expect(body_rows.last).to have_text('Pending')
    expect(page).not_to have_css('input[name="toggle"]')
  end

  it 'renders batch controls, checkboxes, and batch action buttons when batch mode is enabled' do
    render_inline(described_class.new(data: records, batch: true, title: 'Users')) do |component|
      component.with_batch_action_button(:archive, label: 'Archive')
      component.with_batch_action_modal_button(:delete, label: 'Delete') { 'Delete selected items?' }
      component.with_column('Name') { |record| record.name }
    end

    expect(page).to have_css('section.pb-3 button', text: 'Archive')
    expect(page).to have_css('section.pb-3 button[data-bs-target="#modal_delete"]', text: 'Delete')

    expect(page).to have_css('input[name="toggle"][data-admin--batch-actions-target="toggleCheckbox"]')
    checkbox_values = page.all('input[name="ids[]"]').map { |element| element[:value] }
    expect(checkbox_values).to match_array(%w[1 2])

    expect(page).to have_css('#modal_delete .modal-body', text: 'Delete selected items?')
  end
end
