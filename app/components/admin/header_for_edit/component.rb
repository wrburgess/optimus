class Admin::HeaderForEdit::Component < ApplicationComponent
  def initialize(instance:, action:, controller:)
    @instance = instance
    @action = action
    @controller = controller
  end

  def model_name
    @instance.class_name_title
  end

  def instance_name
    @instance.try(:name) || @instance.try(:id)
  end

  def headline
    "Edit #{model_name}: #{instance_name}"
  end

  def render?
    true
  end
end
