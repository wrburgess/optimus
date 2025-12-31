class CreateDataLogJob < ApplicationJob
  include ApplicationHelper

  queue_as :default

  def perform(loggable_id:, loggable_type:, user_id:, operation:, note: nil, meta: nil, original_data: nil)
    loggable_class = loggable_type.safe_constantize
    return unless loggable_class

    loggable = loggable_class.find_by(id: loggable_id)
    user = User.find_by(id: user_id)

    return unless loggable && user

    DataLog.create(
      loggable:,
      user:,
      operation:,
      note:,
      meta:,
      original_data:,
    )
  end
end
