class Admin::SystemPermissionPolicy < AdminApplicationPolicy
  def copy?
    user_access_authorized?(:copy)
  end
end
