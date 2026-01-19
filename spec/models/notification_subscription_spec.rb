require "rails_helper"
require "concerns/archivable_shared"
require "concerns/loggable_shared"

RSpec.describe NotificationSubscription, type: :model do
  it_behaves_like "archivable"
  it_behaves_like "loggable"

  describe "associations" do
    it { is_expected.to belong_to(:notification_topic) }
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:notification_queue_items).dependent(:destroy) }
  end

  describe "validations" do
    subject(:notification_subscription) { build(:notification_subscription) }

    it { is_expected.to validate_presence_of(:distribution_method) }
    it { is_expected.to validate_presence_of(:distribution_frequency) }
    it { is_expected.to validate_inclusion_of(:distribution_method).in_array(NotificationDistributionMethods::METHODS) }
    it { is_expected.to validate_inclusion_of(:distribution_frequency).in_array(NotificationDistributionFrequencies::FREQUENCIES) }

    it "validates uniqueness of distribution_method scoped to topic and user" do
      topic = create(:notification_topic)
      user = create(:user)
      create(:notification_subscription, notification_topic: topic, user: user, distribution_method: "email")
      duplicate = build(:notification_subscription, notification_topic: topic, user: user, distribution_method: "email")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:distribution_method]).to include("has already been taken")
    end

    it "validates summarized_daily_hour is between 0 and 23" do
      subscription = build(:notification_subscription, summarized_daily_hour: 24)
      expect(subscription).not_to be_valid
      expect(subscription.errors[:summarized_daily_hour]).to be_present
    end

    it "allows nil summarized_daily_hour" do
      subscription = build(:notification_subscription, summarized_daily_hour: nil)
      expect(subscription).to be_valid
    end
  end

  describe "scopes" do
    describe ".active" do
      it "returns only active subscriptions" do
        active = create(:notification_subscription, active: true)
        create(:notification_subscription, active: false)

        expect(described_class.active).to contain_exactly(active)
      end
    end

    describe ".for_topic" do
      it "returns subscriptions for the given topic" do
        topic = create(:notification_topic)
        subscription = create(:notification_subscription, notification_topic: topic)
        create(:notification_subscription)

        expect(described_class.for_topic(topic)).to contain_exactly(subscription)
      end
    end

    describe ".for_user" do
      it "returns subscriptions for the given user" do
        user = create(:user)
        subscription = create(:notification_subscription, user: user)
        create(:notification_subscription)

        expect(described_class.for_user(user)).to contain_exactly(subscription)
      end
    end

    describe ".for_method" do
      it "returns subscriptions for the given method" do
        subscription = create(:notification_subscription, distribution_method: "email")
        create(:notification_subscription, distribution_method: "sms")

        expect(described_class.for_method("email")).to contain_exactly(subscription)
      end
    end
  end

  describe "frequency helpers" do
    describe "#immediate?" do
      it "returns true for immediate frequency" do
        subscription = build(:notification_subscription, distribution_frequency: "immediate")
        expect(subscription.immediate?).to be true
      end

      it "returns false for other frequencies" do
        subscription = build(:notification_subscription, distribution_frequency: "summarized_hourly")
        expect(subscription.immediate?).to be false
      end
    end

    describe "#summarized_hourly?" do
      it "returns true for hourly frequency" do
        subscription = build(:notification_subscription, distribution_frequency: "summarized_hourly")
        expect(subscription.summarized_hourly?).to be true
      end
    end

    describe "#summarized_daily?" do
      it "returns true for daily frequency" do
        subscription = build(:notification_subscription, distribution_frequency: "summarized_daily")
        expect(subscription.summarized_daily?).to be true
      end
    end
  end

  describe ".distribution_frequencies" do
    it "returns all frequencies" do
      expect(described_class.distribution_frequencies).to eq(%w[immediate summarized_hourly summarized_daily])
    end
  end
end
