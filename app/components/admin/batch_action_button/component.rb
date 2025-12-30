class Admin::BatchActionButton::Component < ApplicationComponent
  def initialize(action, label:)
    @action = action
    @label = label
  end
end
