require 'rails_helper'

describe Admin::TableForShowRow::Component, type: :component do
  it 'stores the provided name and value' do
    component = described_class.new(name: 'Name', value: 'Alpha')

    expect(component.name).to eq('Name')
    expect(component.value).to eq('Alpha')
  end
end
