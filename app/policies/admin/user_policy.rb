class Admin::UserPolicy < AdminApplicationPolicy
  def trigger_password_reset_email?
    user_access_authorized?(:trigger_password_reset_email)
  end

  def impersonate?
    user_access_authorized?(:impersonate)
  end

  def stop_impersonating?
    true
  end
end
