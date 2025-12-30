class Admin::HeaderForNew::Component < ApplicationComponent
  def initialize(instance:, action:, controller:)
    @instance = instance
    @action = action
    @controller = controller
  end

  def model_name
    @instance.class_name_title
  end

  def headline
    "Create a New #{model_name}"
  end

  def render?
    true
  end
end
