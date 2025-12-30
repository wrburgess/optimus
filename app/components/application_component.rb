class ApplicationComponent < ViewComponent::Base
  include Rails.application.routes.url_helpers
  include Devise::Controllers::Helpers
  include Pundit::Authorization
  include ApplicationHelper

  def helpers
    ActionController::Base.helpers
  end
end
