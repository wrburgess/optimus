require "rails_helper"

RSpec.describe NotificationDistributionFrequencies do
  describe "constants" do
    it "defines IMMEDIATE" do
      expect(described_class::IMMEDIATE).to eq("immediate")
    end

    it "defines SUMMARIZED_HOURLY" do
      expect(described_class::SUMMARIZED_HOURLY).to eq("summarized_hourly")
    end

    it "defines SUMMARIZED_DAILY" do
      expect(described_class::SUMMARIZED_DAILY).to eq("summarized_daily")
    end
  end

  describe ".all" do
    it "returns all frequency values" do
      expect(described_class.all).to eq(
        [
          "immediate",
          "summarized_hourly",
          "summarized_daily"
        ]
      )
    end

    it "is frozen to prevent modification" do
      expect(described_class::IMMEDIATE).to be_frozen
      expect(described_class::SUMMARIZED_HOURLY).to be_frozen
      expect(described_class::SUMMARIZED_DAILY).to be_frozen
    end
  end

  describe ".options_for_select" do
    it "returns an array of label/value pairs for form selects" do
      expect(described_class.options_for_select).to eq(
        [
          [ "Immediate", "immediate" ],
          [ "Summarized Hourly", "summarized_hourly" ],
          [ "Summarized Daily", "summarized_daily" ]
        ]
      )
    end
  end
end
