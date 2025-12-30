class Admin::BatchActionModalButton::Component < ApplicationComponent
  def initialize(action, label:)
    @action = action
    @label = label
  end
end
