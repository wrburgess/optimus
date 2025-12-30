class Admin::TableForIndexColumn::Component < ApplicationComponent
  attr_reader :label, :td_block

  def initialize(label, &block)
    @label = label
    @td_block = block
  end
end
