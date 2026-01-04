FactoryBot.define do
  factory :data_log do
    operation { SystemOperations.all.sample }
    note { Faker::Lorem.sentence(word_count: 12) }
    meta { nil }
    original_data { nil }
  end
end
