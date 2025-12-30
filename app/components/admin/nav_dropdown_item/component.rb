class Admin::NavDropdownItem::Component < ApplicationComponent
  def initialize(name:, path:, resource: nil, operation: "index", new_window: false)
    @name = name
    @path = path
    @resource = resource
    @operation = operation
    @new_window = new_window
  end

  def render?
    return true if @resource.nil?

    Pundit.policy(current_user, [ :admin, @resource ]).send("#{@operation}?")
  end
end
