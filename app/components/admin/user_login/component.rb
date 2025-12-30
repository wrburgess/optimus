class Admin::UserLogin::Component < ApplicationComponent
  def initialize(user_signed_in:)
    @user_signed_in = user_signed_in
  end

  def render?
    true
  end

  def style
    {
      base: 'navbar-nav mb-2 mb-lg-0'
    }
  end
end
