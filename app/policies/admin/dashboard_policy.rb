class Admin::DashboardPolicy < AdminApplicationPolicy
  def initialize(user, dashboard)
    @user = user
    @record = dashboard
  end

  def index?
    user.has_system_permission?
  end
end
