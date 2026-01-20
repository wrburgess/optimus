require "rails_helper"
require "concerns/archivable_shared"
require "concerns/loggable_shared"

RSpec.describe NotificationTemplate, type: :model do
  it_behaves_like "archivable"
  it_behaves_like "loggable"

  describe "associations" do
    it { is_expected.to belong_to(:notification_topic) }
  end

  describe "validations" do
    subject(:notification_template) { build(:notification_template) }

    it { is_expected.to validate_presence_of(:distribution_method) }
    it { is_expected.to validate_presence_of(:subject_template) }
    it { is_expected.to validate_presence_of(:body_template) }
    it { is_expected.to validate_inclusion_of(:distribution_method).in_array(NotificationDistributionMethods.all) }

    it "validates uniqueness of distribution_method scoped to notification_topic_id" do
      topic = create(:notification_topic)
      create(:notification_template, notification_topic: topic, distribution_method: "email")
      duplicate = build(:notification_template, notification_topic: topic, distribution_method: "email")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:distribution_method]).to include("has already been taken")
    end
  end

  describe "scopes" do
    describe ".active" do
      it "returns only active templates" do
        active = create(:notification_template, active: true)
        create(:notification_template, active: false)

        expect(described_class.active).to contain_exactly(active)
      end
    end
  end

  describe ".ransackable_attributes" do
    it "includes expected attributes" do
      expect(described_class.ransackable_attributes).to include("distribution_method", "active", "subject_template")
    end
  end

  describe ".distribution_methods" do
    it "returns all methods" do
      expect(described_class.distribution_methods).to eq(%w[email sms chat])
    end
  end

  describe ".distribution_methods_for_select" do
    it "returns titleized options" do
      expect(described_class.distribution_methods_for_select).to include([ "Email", "email" ])
    end
  end
end
