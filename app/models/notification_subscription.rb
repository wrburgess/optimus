class NotificationSubscription < ApplicationRecord
  include Archivable
  include Loggable
  include HasDistributionMethod
  include HasDistributionFrequency

  belongs_to :notification_topic
  belongs_to :user

  has_many :notification_queue_items, dependent: :destroy

  validates :distribution_method, uniqueness: { scope: [ :notification_topic_id, :user_id ] }
  validates :summarized_daily_hour,
            numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 23 },
            allow_nil: true

  scope :select_order, -> { order(:distribution_method) }
  scope :active, -> { where(active: true) }
  scope :for_topic, ->(topic) { where(notification_topic: topic) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_method, ->(method) { where(distribution_method: method) }

  def self.ransackable_attributes(*)
    %w[
      active
      archived_at
      distribution_frequency
      distribution_method
      id
      notification_topic_id
      summarized_daily_hour
      updated_at
      user_id
    ]
  end

  def self.ransackable_associations(*)
    %w[notification_topic user]
  end

  def self.options_for_select
    select_order.includes(:notification_topic, :user).map do |instance|
      [ "#{instance.notification_topic.name} - #{instance.user.full_name} - #{instance.distribution_method.titleize}", instance.id ]
    end
  end

  def self.default_sort
    [ created_at: :desc ]
  end

  def name
    "#{notification_topic.name} - #{user.full_name}"
  end
end
