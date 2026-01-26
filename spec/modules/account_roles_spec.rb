require "rails_helper"

RSpec.describe AccountRoles do
  describe "constants" do
    it "defines ADMIN" do
      expect(described_class::ADMIN).to eq("admin")
    end

    it "defines USER" do
      expect(described_class::USER).to eq("user")
    end

    it "defines MANAGER" do
      expect(described_class::MANAGER).to eq("manager")
    end

    it "defines BILLING" do
      expect(described_class::BILLING).to eq("billing")
    end
  end

  describe ".all" do
    it "returns all role values" do
      expect(described_class.all).to eq([ "admin", "user", "manager", "billing" ])
    end

    it "returns frozen strings" do
      expect(described_class::ADMIN).to be_frozen
      expect(described_class::USER).to be_frozen
      expect(described_class::MANAGER).to be_frozen
      expect(described_class::BILLING).to be_frozen
    end
  end

  describe ".options_for_select" do
    it "returns an array of titleized label and value pairs" do
      expect(described_class.options_for_select).to eq(
        [
          [ "Admin", "admin" ],
          [ "User", "user" ],
          [ "Manager", "manager" ],
          [ "Billing", "billing" ]
        ]
      )
    end
  end
end
