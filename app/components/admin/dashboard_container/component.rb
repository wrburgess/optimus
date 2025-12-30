class Admin::DashboardContainer::Component < ApplicationComponent
  def initialize(stimulus_controller: nil, stimulus_target: nil)
    @stimulus_controller = stimulus_controller
    @stimulus_target = stimulus_target
  end

  def stimulus_attributes
    attrs = {}
    attrs[:controller] = "#{@stimulus_controller}" if @stimulus_controller
    attrs["#{@stimulus_controller}-target"] = @stimulus_target if @stimulus_target

    attrs
  end
end
