class SystemGroupUser < ApplicationRecord
  belongs_to :system_group
  belongs_to :user
end
