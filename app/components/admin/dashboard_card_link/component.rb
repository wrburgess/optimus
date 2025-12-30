class Admin::DashboardCardLink::Component < ApplicationComponent
  def initialize(name:, url:, policy: nil, new_window: false)
    @name = name
    @new_window = new_window
    @policy = policy
    @url = url
  end

  def render?
    return true if @policy.nil?

    Pundit.policy(current_user, [:admin, @policy]).index?
  end

  def link
    if @new_window
      external_link_to(@name, @url)
    else
      link_to(@name, @url)
    end
  end
end
