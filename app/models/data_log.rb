class DataLog < ApplicationRecord
  belongs_to :loggable, polymorphic: true
  belongs_to :user

  def self.ransackable_attributes(*)
    %w[
      created_at
      id
      id_value
      loggable_id
      loggable_type
      meta
      note
      operation
      original_data
      updated_at
      user_id
    ]
  end

  def self.ransackable_associations(*)
    %w[user loggable]
  end

  def self.default_sort
    ['created_at desc', 'updated_at desc']
  end
end
