class NotificationQueueItem < ApplicationRecord
  include Loggable
  include NotificationDistributionMethods

  belongs_to :notification_subscription
  belongs_to :notification_message
  belongs_to :user

  validates :distribute_at, presence: true

  scope :select_order, -> { order(distribute_at: :asc) }
  scope :pending, -> { where(distributed_at: nil) }
  scope :distributed, -> { where.not(distributed_at: nil) }
  scope :ready_to_distribute, -> { pending.where("distribute_at <= ?", Time.current) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_method, ->(method) { where(distribution_method: method) }
  scope :immediate, -> { joins(:notification_subscription).where(notification_subscriptions: { distribution_frequency: "immediate" }) }
  scope :summarized, -> { joins(:notification_subscription).where.not(notification_subscriptions: { distribution_frequency: "immediate" }) }

  def self.ransackable_attributes(*)
    %w[
      distribute_at
      distributed_at
      distribution_method
      id
      notification_message_id
      notification_subscription_id
      user_id
      created_at
      updated_at
    ]
  end

  def self.ransackable_associations(*)
    %w[notification_message notification_subscription user]
  end

  def self.default_sort
    [ distribute_at: :asc ]
  end

  def distributed?
    distributed_at.present?
  end

  def pending?
    distributed_at.nil?
  end

  def mark_distributed!
    update!(distributed_at: Time.current)
  end
end
