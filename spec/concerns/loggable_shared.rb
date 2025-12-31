require 'rails_helper'

RSpec.shared_examples 'loggable' do
  it 'creates a log based on the user and action' do
    instance_of_class = create(described_class.to_s.underscore.to_sym)
    user = create(:user)
    operation = SystemOperations.all.sample
    note = Faker::Lorem.sentence
    meta = Faker::Json.shallow_json(width: 3)

    perform_enqueued_jobs do
      instance_of_class.log(user:, operation:, note:, meta:)
    end

    data_log = DataLog.find_by(note:)
    expect(data_log.user).to eq(user)
    expect(data_log.operation).to eq(operation)
  end
end
