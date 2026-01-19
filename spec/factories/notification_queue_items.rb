FactoryBot.define do
  factory :notification_queue_item do
    association :notification_subscription
    association :notification_message
    association :user
    distribution_method { "email" }
    distribute_at { Time.current }
    distributed_at { nil }

    trait :distributed do
      distributed_at { Time.current }
    end

    trait :pending do
      distributed_at { nil }
    end

    trait :future do
      distribute_at { 1.hour.from_now }
    end
  end
end
