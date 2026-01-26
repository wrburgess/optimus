require "rails_helper"

RSpec.describe DataLogActionTypes do
  describe "constants" do
    it "defines ARCHIVED" do
      expect(described_class::ARCHIVED).to eq("archived")
    end

    it "defines CREATED" do
      expect(described_class::CREATED).to eq("created")
    end

    it "defines DELETED" do
      expect(described_class::DELETED).to eq("deleted")
    end

    it "defines DUPLICATED" do
      expect(described_class::DUPLICATED).to eq("duplicated")
    end

    it "defines SHARED" do
      expect(described_class::SHARED).to eq("shared")
    end

    it "defines UPDATED" do
      expect(described_class::UPDATED).to eq("updated")
    end

    it "defines UPDATED_BY_COPY" do
      expect(described_class::UPDATED_BY_COPY).to eq("updated by copy")
    end

    it "defines VIEWED" do
      expect(described_class::VIEWED).to eq("viewed")
    end
  end

  describe ".all" do
    it "returns all action type values" do
      expect(described_class.all).to eq(
        [
          "archived",
          "created",
          "deleted",
          "duplicated",
          "shared",
          "updated",
          "updated by copy",
          "viewed"
        ]
      )
    end

    it "returns frozen strings" do
      expect(described_class::ARCHIVED).to be_frozen
      expect(described_class::CREATED).to be_frozen
      expect(described_class::UPDATED).to be_frozen
    end
  end

  describe ".options_for_select" do
    it "returns an array of titleized label and value pairs" do
      options = described_class.options_for_select

      expect(options).to include([ "Archived", "archived" ])
      expect(options).to include([ "Created", "created" ])
      expect(options).to include([ "Updated", "updated" ])
      expect(options).to include([ "Updated By Copy", "updated by copy" ])
    end
  end
end
