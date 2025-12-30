module Loggable
  extend ActiveSupport::Concern

  included do
    has_many :data_logs, as: :loggable, dependent: :destroy
  end

  def log(user:, operation:, note: nil, meta: nil, original_data: nil)
    loggable_id = id
    loggable_type = self.class.name
    user_id = user.id

    CreateDataLogJob.perform_later(
      loggable_id: loggable_id,
      loggable_type: loggable_type,
      user_id: user_id,
      operation: operation,
      note: note,
      meta: meta,
      original_data: original_data,
    )
  end
end
