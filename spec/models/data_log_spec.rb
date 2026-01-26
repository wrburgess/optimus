require "rails_helper"

RSpec.describe DataLog, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:loggable) }
    it { is_expected.to belong_to(:user) }
  end

  describe ".ransackable_attributes" do
    it "includes expected attributes" do
      expected = %w[
        created_at id id_value loggable_id loggable_type
        meta note operation original_data updated_at user_id
      ]

      expect(described_class.ransackable_attributes).to match_array(expected)
    end
  end

  describe ".ransackable_associations" do
    it "includes user and loggable" do
      expect(described_class.ransackable_associations).to match_array(%w[user loggable])
    end
  end

  describe ".default_sort" do
    it "returns created_at and updated_at descending" do
      expect(described_class.default_sort).to eq([ "created_at desc", "updated_at desc" ])
    end
  end

  describe "factory" do
    it "creates a valid data log" do
      data_log = create(:data_log)

      expect(data_log).to be_persisted
      expect(data_log.loggable).to be_present
      expect(data_log.user).to be_present
      expect(data_log.operation).to eq("update")
    end
  end
end
