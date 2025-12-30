class Admin::NavBar::Component < ApplicationComponent
  def initialize(environment:)
    @environment = environment
  end

  renders_many :nav_items, Admin::NavItem::Component

  def env_class_color
    case @environment
    when "development"
      "bg-primary"
    when "staging"
      "bg-danger"
    else
      "bg-secondary"
    end
  end
end
