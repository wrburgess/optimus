require "rails_helper"

RSpec.describe SystemOperations do
  describe "constants" do
    it "defines ARCHIVED" do
      expect(described_class::ARCHIVED).to eq("archived")
    end

    it "defines CREATE" do
      expect(described_class::CREATE).to eq("create")
    end

    it "defines UPDATE" do
      expect(described_class::UPDATE).to eq("update")
    end

    it "defines DELETED" do
      expect(described_class::DELETED).to eq("deleted")
    end

    it "defines INDEX" do
      expect(described_class::INDEX).to eq("index")
    end

    it "defines SHOW" do
      expect(described_class::SHOW).to eq("show")
    end
  end

  describe ".all" do
    it "returns all operation values sorted alphabetically" do
      result = described_class.all

      expect(result).to include("archived", "create", "update", "deleted", "index", "show")
      expect(result).to eq(result.sort)
    end

    it "returns frozen strings" do
      expect(described_class::ARCHIVED).to be_frozen
      expect(described_class::CREATE).to be_frozen
      expect(described_class::UPDATE).to be_frozen
    end
  end

  describe ".options_for_select" do
    it "returns an array of uppercase label and lowercase value pairs" do
      options = described_class.options_for_select

      expect(options).to include([ "ARCHIVED", "archived" ])
      expect(options).to include([ "CREATE", "create" ])
      expect(options).to include([ "UPDATE", "update" ])
    end
  end
end
