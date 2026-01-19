class NotificationMessage < ApplicationRecord
  include Loggable

  belongs_to :notification_topic

  has_many :notification_queue_items, dependent: :destroy

  validates :subject, presence: true
  validates :body, presence: true

  scope :select_order, -> { order(created_at: :desc) }

  def self.ransackable_attributes(*)
    %w[
      body
      id
      metadata
      notification_topic_id
      subject
      created_at
      updated_at
    ]
  end

  def self.ransackable_associations(*)
    %w[notification_topic notification_queue_items]
  end

  def self.default_sort
    [ created_at: :desc ]
  end
end
