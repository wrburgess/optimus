FactoryBot.define do
  factory :notification_message do
    association :notification_topic
    subject { Faker::Lorem.sentence }
    body { Faker::Lorem.paragraph }
    metadata { { user_id: 1, action: "test" } }
  end
end
