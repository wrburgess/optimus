FactoryBot.define do
  factory :data_log do
    association :loggable, factory: :system_permission
    association :user

    operation { "update" }
    note { "Change captured by data log." }
    meta { { "origin" => "factory" } }
    original_data { { "before" => "value" } }
  end
end
