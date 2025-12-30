class SystemGroupSystemRole < ApplicationRecord
  belongs_to :system_group
  belongs_to :system_role
end
