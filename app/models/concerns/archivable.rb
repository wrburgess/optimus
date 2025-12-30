module Archivable
  extend ActiveSupport::Concern

  included do
    scope :actives, -> { where(archived_at: nil) }
    scope :archives, -> { where.not(archived_at: nil) }
  end

  def active?
    archived_at.blank?
  end

  def archived?
    archived_at.present?
  end

  def archive
    update(archived_at: DateTime.current)
  end

  def unarchive
    update(archived_at: nil)
  end
end
