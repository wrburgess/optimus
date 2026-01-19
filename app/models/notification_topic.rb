class NotificationTopic < ApplicationRecord
  include Archivable
  include Loggable

  validates :name, presence: true
  validates :key, presence: true, uniqueness: true

  has_many :notification_templates, dependent: :destroy
  has_many :notification_subscriptions, dependent: :destroy
  has_many :notification_messages, dependent: :destroy

  scope :select_order, -> { order(:name) }

  def self.ransackable_attributes(*)
    %w[
      archived_at
      description
      id
      key
      name
      updated_at
    ]
  end

  def self.ransackable_associations(*)
    %w[
      notification_messages
      notification_subscriptions
      notification_templates
    ]
  end

  def self.options_for_select
    select_order.map { |instance| [ instance.name, instance.id ] }
  end

  def self.default_sort
    [ name: :asc, created_at: :desc ]
  end

  def self.find_by_key(key)
    find_by(key: key)
  end

  def self.find_by_key!(key)
    find_by!(key: key)
  end
end
