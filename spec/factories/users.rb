FactoryBot.define do
  factory :user do
    sequence(:email) { Faker::Internet.unique.email }
    password do
      base = Faker::Internet.password(min_length: 12, max_length: 16, mix_case: true, special_characters: true)
      base.match?(/\d/) ? base : "#{base}1"
    end
    password_confirmation { password }
    confirmed_at { Time.current }

    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    prefix { Faker::Name.prefix }
    suffix { Faker::Name.suffix }
    phone_number { Faker::PhoneNumber.phone_number }
  end
end
