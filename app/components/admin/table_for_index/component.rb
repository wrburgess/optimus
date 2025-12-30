class Admin::TableForIndex::Component < ApplicationComponent
  renders_many :columns, ->(title, &block) { Admin::TableForIndexColumn::Component.new(title, &block) }
  renders_many :batch_action_buttons, Admin::BatchActionButton::Component
  renders_many :batch_action_modal_buttons, Admin::BatchActionModalButton::Component

  def initialize(data:, title: nil, batch: false)
    @data = data
    @title = title
    @batch = batch
  end
end
