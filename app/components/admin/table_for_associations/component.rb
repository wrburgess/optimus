class Admin::TableForAssociations::Component < ApplicationComponent
  renders_many :columns, ->(label:, header: false, &block) { ColumnComponent.new(label:, header:, &block) }

  def initialize(data:, title: nil)
    @data = data
    @title = title
  end

  def render?
    true
  end

  class ColumnComponent < ApplicationComponent
    attr_reader :label, :header, :td_block

    def initialize(label:, header:, &block)
      @label = label
      @header = header
      @td_block = block
    end
  end
end
