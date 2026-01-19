FactoryBot.define do
  factory :notification_template do
    association :notification_topic
    distribution_method { "email" }
    subject_template { "Subject: <%= subject %>" }
    body_template { "Hello <%= user.full_name %>, this is a notification." }
    active { true }
  end
end
