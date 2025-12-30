class SystemRoleSystemPermission < ApplicationRecord
  belongs_to :system_role
  belongs_to :system_permission
end
