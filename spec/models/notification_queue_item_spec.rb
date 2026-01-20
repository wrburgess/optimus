require "rails_helper"
require "concerns/loggable_shared"

RSpec.describe NotificationQueueItem, type: :model do
  it_behaves_like "loggable"

  describe "associations" do
    it { is_expected.to belong_to(:notification_subscription) }
    it { is_expected.to belong_to(:notification_message) }
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    subject(:notification_queue_item) { build(:notification_queue_item) }

    it { is_expected.to validate_presence_of(:distribution_method) }
    it { is_expected.to validate_presence_of(:distribute_at) }
    it { is_expected.to validate_inclusion_of(:distribution_method).in_array(NotificationDistributionMethods.all) }
  end

  describe "scopes" do
    describe ".pending" do
      it "returns only pending items" do
        pending_item = create(:notification_queue_item, distributed_at: nil)
        create(:notification_queue_item, distributed_at: Time.current)

        expect(described_class.pending).to contain_exactly(pending_item)
      end
    end

    describe ".distributed" do
      it "returns only distributed items" do
        create(:notification_queue_item, distributed_at: nil)
        distributed_item = create(:notification_queue_item, distributed_at: Time.current)

        expect(described_class.distributed).to contain_exactly(distributed_item)
      end
    end

    describe ".ready_to_distribute" do
      it "returns pending items where distribute_at is past" do
        ready = create(:notification_queue_item, distribute_at: 1.hour.ago, distributed_at: nil)
        create(:notification_queue_item, distribute_at: 1.hour.from_now, distributed_at: nil)
        create(:notification_queue_item, distribute_at: 1.hour.ago, distributed_at: Time.current)

        expect(described_class.ready_to_distribute).to contain_exactly(ready)
      end
    end

    describe ".for_user" do
      it "returns items for the given user" do
        user = create(:user)
        item = create(:notification_queue_item, user: user)
        create(:notification_queue_item)

        expect(described_class.for_user(user)).to contain_exactly(item)
      end
    end

    describe ".for_method" do
      it "returns items for the given method" do
        item = create(:notification_queue_item, distribution_method: "email")
        create(:notification_queue_item, distribution_method: "sms")

        expect(described_class.for_method("email")).to contain_exactly(item)
      end
    end
  end

  describe "#distributed?" do
    it "returns true when distributed_at is present" do
      item = build(:notification_queue_item, distributed_at: Time.current)
      expect(item.distributed?).to be true
    end

    it "returns false when distributed_at is nil" do
      item = build(:notification_queue_item, distributed_at: nil)
      expect(item.distributed?).to be false
    end
  end

  describe "#pending?" do
    it "returns true when distributed_at is nil" do
      item = build(:notification_queue_item, distributed_at: nil)
      expect(item.pending?).to be true
    end

    it "returns false when distributed_at is present" do
      item = build(:notification_queue_item, distributed_at: Time.current)
      expect(item.pending?).to be false
    end
  end

  describe "#mark_distributed!" do
    it "sets distributed_at to current time" do
      item = create(:notification_queue_item, distributed_at: nil)

      freeze_time do
        item.mark_distributed!
        expect(item.distributed_at).to eq(Time.current)
      end
    end
  end
end
