class Admin::HeaderForUpload::Component < ApplicationComponent
  def initialize(instance:, action:, controller:)
    @instance = instance
    @action = action
    @controller = controller
  end

  def model_name
    @instance.class_name_title
  end

  def headline
    "#{model_name}: Upload CSV or XLSX"
  end

  def render?
    true
  end
end
