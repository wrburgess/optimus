require "rails_helper"
require "concerns/archivable_shared"
require "concerns/loggable_shared"

RSpec.describe NotificationTopic, type: :model do
  it_behaves_like "archivable"
  it_behaves_like "loggable"

  describe "associations" do
    it { is_expected.to have_many(:notification_templates).dependent(:destroy) }
    it { is_expected.to have_many(:notification_subscriptions).dependent(:destroy) }
    it { is_expected.to have_many(:notification_messages).dependent(:destroy) }
  end

  describe "validations" do
    subject(:notification_topic) { build(:notification_topic) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:key) }

    it "validates uniqueness of key" do
      create(:notification_topic, key: "user.created")
      duplicate = build(:notification_topic, key: "user.created")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:key]).to include("has already been taken")
    end
  end

  describe ".ransackable_attributes" do
    it "includes expected attributes" do
      expect(described_class.ransackable_attributes).to include("name", "key", "description")
    end
  end

  describe ".select_order" do
    it "orders topics by name" do
      second = create(:notification_topic, name: "Zebra Topic")
      first = create(:notification_topic, name: "Alpha Topic")

      expect(described_class.select_order.pluck(:id)).to eq([first.id, second.id])
    end
  end

  describe ".options_for_select" do
    it "returns name and id pairs" do
      topic = create(:notification_topic, name: "User Created")

      expect(described_class.options_for_select).to include(["User Created", topic.id])
    end
  end

  describe ".find_by_key" do
    it "finds topic by key" do
      topic = create(:notification_topic, key: "user.password_changed")

      expect(described_class.find_by_key("user.password_changed")).to eq(topic)
    end

    it "returns nil when not found" do
      expect(described_class.find_by_key("nonexistent")).to be_nil
    end
  end

  describe ".find_by_key!" do
    it "finds topic by key" do
      topic = create(:notification_topic, key: "user.password_changed")

      expect(described_class.find_by_key!("user.password_changed")).to eq(topic)
    end

    it "raises error when not found" do
      expect { described_class.find_by_key!("nonexistent") }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
