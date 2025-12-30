class Admin::TableForShowRow::Component < ApplicationComponent
  attr_reader :name, :value

  def initialize(name:, value:)
    @name = name
    @value = value
  end
end
