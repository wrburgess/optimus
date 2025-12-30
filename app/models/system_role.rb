class SystemRole < ApplicationRecord
  include Loggable

  validates :name, presence: true

  has_many :system_role_system_permissions, dependent: :destroy
  has_many :system_permissions, through: :system_role_system_permissions

  has_many :system_group_system_roles, dependent: :destroy
  has_many :system_groups, through: :system_group_system_roles

  has_many :users, through: :system_groups

  scope :select_order, -> { order(name: :asc) }

  def self.ransackable_attributes(*)
    %w[
      name
      abbreviation
      description
      id
    ]
  end

  def self.ransackable_associations(*)
    %w[
      system_groups
      system_permissions
      users
    ]
  end

  def self.options_for_select
    select_order.map { |instance| [ instance.name, instance.id ] }
  end

  def self.default_sort
    [ name: :asc, created_at: :desc ]
  end

  def update_associations(params)
    SystemRole.transaction do
      system_group_system_roles.delete_all if params[:system_role][:system_group_ids].present?
      params[:system_role][:system_group_ids]&.each do |system_group_id|
        SystemGroupSystemRole.create(system_role: self, system_group_id:)
      end

      system_role_system_permissions.delete_all if params[:system_role][:system_permission_ids].present?
      params[:system_role][:system_permission_ids]&.each do |system_permission_id|
        SystemRoleSystemPermission.create(system_role: self, system_permission_id:)
      end
    end
  end
end
