require "rails_helper"

RSpec.describe NotificationDistributionMethods do
  describe "constants" do
    it "defines EMAIL" do
      expect(described_class::EMAIL).to eq("email")
    end

    it "defines SMS" do
      expect(described_class::SMS).to eq("sms")
    end

    it "defines CHAT" do
      expect(described_class::CHAT).to eq("chat")
    end
  end

  describe ".all" do
    it "returns all method values" do
      expect(described_class.all).to eq(
        [
          "email",
          "sms",
          "chat"
        ]
      )
    end

    it "is frozen to prevent modification" do
      expect(described_class::EMAIL).to be_frozen
      expect(described_class::SMS).to be_frozen
      expect(described_class::CHAT).to be_frozen
    end
  end

  describe ".options_for_select" do
    it "returns an array of label/value pairs for form selects" do
      expect(described_class.options_for_select).to eq(
        [
          [ "Email", "email" ],
          [ "Sms", "sms" ],
          [ "Chat", "chat" ]
        ]
      )
    end
  end
end
