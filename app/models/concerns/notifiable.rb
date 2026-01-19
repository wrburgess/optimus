module Notifiable
  extend ActiveSupport::Concern

  def notify_topic(topic_key, context: {})
    NotifyTopicJob.perform_later(
      topic_key: topic_key,
      context: Notifiable.serialize_context(context)
    )
  end

  class << self
    def serialize_context(context)
      context.transform_values do |value|
        if value.is_a?(ActiveRecord::Base)
          { "_class" => value.class.name, "_id" => value.id }
        else
          value
        end
      end
    end

    def deserialize_context(serialized_context)
      serialized_context.transform_values do |value|
        if value.is_a?(Hash) && value["_class"].present? && value["_id"].present?
          value["_class"].constantize.find_by(id: value["_id"])
        else
          value
        end
      end.symbolize_keys
    end
  end
end
