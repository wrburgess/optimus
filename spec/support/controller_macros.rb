module ControllerMacros
  def login_user
    before do
      user = create(:user, confirmed_at: Time.current)

      if respond_to?(:sign_in) && self.class.included_modules.include?(Devise::Test::IntegrationHelpers)
        sign_in user
      else
        if defined?(@request) && @request.respond_to?(:env)
          @request.env['devise.mapping'] = Devise.mappings[:user]
        end
        sign_in user if respond_to?(:sign_in)
      end

      @current_user = user
    end
  end
end
