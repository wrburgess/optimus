class CreateDataLogJob < ApplicationJob
  include ApplicationHelper

  queue_as :default

  def perform(loggable_id:, loggable_type:, user_id:, operation:, note: nil, meta: nil, original_data: nil)
    loggable = loggable_type.constantize.find(loggable_id)
    user = User.find(user_id)

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
