FactoryBot.define do
  factory :notification_topic do
    sequence(:name) { |n| "Notification Topic #{n}" }
    sequence(:key) { |n| "notification.topic.#{n}" }
    description { Faker::Lorem.sentence }
  end
end
