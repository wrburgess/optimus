class Admin::InterfaceNotification::Component < ApplicationComponent
  def initialize(flash:)
    @flash = flash
  end

  def render?
    !flash.empty?
  end
end
