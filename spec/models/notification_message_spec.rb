require "rails_helper"
require "concerns/loggable_shared"

RSpec.describe NotificationMessage, type: :model do
  it_behaves_like "loggable"

  describe "associations" do
    it { is_expected.to belong_to(:notification_topic) }
    it { is_expected.to have_many(:notification_queue_items).dependent(:destroy) }
  end

  describe "validations" do
    subject(:notification_message) { build(:notification_message) }

    it { is_expected.to validate_presence_of(:subject) }
    it { is_expected.to validate_presence_of(:body) }
  end

  describe ".ransackable_attributes" do
    it "includes expected attributes" do
      expect(described_class.ransackable_attributes).to include("subject", "body", "metadata")
    end
  end

  describe ".select_order" do
    it "orders messages by created_at descending" do
      first = create(:notification_message, created_at: 1.hour.ago)
      second = create(:notification_message, created_at: Time.current)

      expect(described_class.select_order.pluck(:id)).to eq([ second.id, first.id ])
    end
  end
end
