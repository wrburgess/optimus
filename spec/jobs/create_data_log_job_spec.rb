require 'rails_helper'

describe CreateDataLogJob, type: :job do
  let(:user) { create(:user) }
  let(:loggable) { create(:system_permission) }
  let(:job_args) do
    {
      loggable_id: loggable.id,
      loggable_type: loggable.class.name,
      user_id: user.id,
      operation: 'update',
      note: 'Captured change',
      meta: { 'source' => 'job' },
      original_data: { 'before' => 'value' }
    }
  end

  it 'creates a data log record with provided attributes' do
    expect do
      described_class.perform_now(**job_args)
    end.to change(DataLog, :count).by(1)

    data_log = DataLog.order(:created_at).last
    expect(data_log.loggable).to eq(loggable)
    expect(data_log.user).to eq(user)
    expect(data_log.operation).to eq('update')
    expect(data_log.note).to eq('Captured change')
    expect(data_log.meta).to eq({ 'source' => 'job' })
    expect(data_log.original_data).to eq({ 'before' => 'value' })
  end

  it 'does not create a data log when the loggable is missing' do
    expect do
      described_class.perform_now(**job_args.merge(loggable_id: 0))
    end.not_to change(DataLog, :count)
  end
end
