class Admin::NavItem::Component < ApplicationComponent
  renders_many :dropdown_items, Admin::NavDropdownItem::Component

  def initialize(title:)
    @title = title
  end
end
