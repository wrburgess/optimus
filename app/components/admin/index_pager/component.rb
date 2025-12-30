class Admin::IndexPager::Component < ApplicationComponent
  def initialize(pagy:, instance:)
    @pagy = pagy
    @instance = instance
  end

  def render?
    @instance.present? && @pagy.present?
  end
end
