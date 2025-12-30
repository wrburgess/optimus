class SystemGroup < ApplicationRecord
  include Loggable

  validates :name, presence: true

  has_many :system_group_users, dependent: :destroy
  has_many :users, through: :system_group_users

  has_many :system_group_system_roles, dependent: :destroy
  has_many :system_roles, through: :system_group_system_roles

  has_many :system_permissions, through: :system_roles

  scope :select_order, -> { order(:name) }

  def self.ransackable_attributes(*)
    %w[
      abbreviation
      description
      id
      name
    ]
  end

  def self.ransackable_associations(*)
    %w[
      system_permissions
      system_roles
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
    SystemGroup.transaction do
      system_group_users.delete_all if params[:system_group][:user_ids].present?
      params[:system_group][:user_ids]&.each do |user_id|
        SystemGroupUser.create(system_group: self, user_id:)
      end

      system_group_system_roles.delete_all if params[:system_group][:system_role_ids].present?
      params[:system_group][:system_role_ids]&.each do |system_role_id|
        SystemGroupSystemRole.create(system_group: self, system_role_id:)
      end
    end
  end
end
