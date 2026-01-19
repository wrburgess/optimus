FactoryBot.define do
  factory :notification_subscription do
    association :notification_topic
    association :user
    distribution_method { "email" }
    distribution_frequency { "immediate" }
    summarized_daily_hour { nil }
    active { true }

    trait :hourly do
      distribution_frequency { "summarized_hourly" }
    end

    trait :daily do
      distribution_frequency { "summarized_daily" }
      summarized_daily_hour { 9 }
    end

    trait :inactive do
      active { false }
    end
  end
end
