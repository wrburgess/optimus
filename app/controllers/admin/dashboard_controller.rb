class Admin::DashboardController < AdminController
  before_action :authenticate_user!

  def index
    authorize(%i[admin dashboard])
  end
end
