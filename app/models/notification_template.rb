class NotificationTemplate < ApplicationRecord
  include Archivable
  include Loggable
  include NotificationDistributionMethods

  belongs_to :notification_topic

  validates :subject_template, presence: true
  validates :body_template, presence: true
  validates :distribution_method, uniqueness: { scope: :notification_topic_id }

  scope :select_order, -> { order(:distribution_method) }
  scope :active, -> { where(active: true) }

  def self.ransackable_attributes(*)
    %w[
      active
      archived_at
      body_template
      distribution_method
      id
      notification_topic_id
      subject_template
      updated_at
    ]
  end

  def self.ransackable_associations(*)
    %w[notification_topic]
  end

  def self.options_for_select
    select_order.map { |instance| [ "#{instance.notification_topic.name} - #{instance.distribution_method.titleize}", instance.id ] }
  end

  def self.default_sort
    [ distribution_method: :asc, created_at: :desc ]
  end
end
