class SystemPermission < ApplicationRecord
  include Loggable

  validates :name, presence: true
  validates :resource, presence: true
  validates :operation, presence: true

  has_many :system_role_system_permissions, dependent: :destroy
  has_many :system_roles, through: :system_role_system_permissions

  has_many :system_groups, through: :system_roles
  has_many :users, through: :system_groups

  scope :select_order, -> { order(name: :asc) }

  def self.ransackable_attributes(*)
    %w[
      abbreviation
      description
      id
      name
      operation
      resource
    ]
  end

  def self.ransackable_associations(*)
    %w[
      system_roles
      users
    ]
  end

  def self.options_for_select
    select_order.map { |instance| [instance.name, instance.id] }
  end

  def self.default_sort
    [name: :asc, created_at: :desc]
  end

  def update_associations(params)
    SystemPermission.transaction do
      system_role_system_permissions.delete_all if params[:system_permission][:system_role_ids].present?
      params[:system_permission][:system_role_ids]&.each do |system_role_id|
        SystemRoleSystemPermission.create(system_permission: self, system_role_id:)
      end
    end
  end

  def copy_with_associations
    new_system_permission = dup
    new_system_permission.save

    DuplicateSystemPermissionAssociationsJob.perform_now(id, new_system_permission.id)

    new_system_permission
  end
end
