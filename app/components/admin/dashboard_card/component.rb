class Admin::DashboardCard::Component < ApplicationComponent
  renders_many :links, Admin::DashboardCardLink::Component

  def initialize(title:)
    @title = title
  end
end
