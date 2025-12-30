class Admin::TableForShow::Component < ApplicationComponent
  renders_many :rows, ->(name:, value:) { Admin::TableForShowRow::Component.new(name: name, value: value) }

  def initialize(title: nil)
    @title = title
  end

  def render?
    true
  end
end
