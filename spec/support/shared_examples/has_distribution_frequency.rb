RSpec.shared_examples "has_distribution_frequency" do
  describe "validations from HasDistributionFrequency" do
    it { is_expected.to validate_presence_of(:distribution_frequency) }
    it { is_expected.to validate_inclusion_of(:distribution_frequency).in_array(NotificationDistributionFrequencies.all) }
  end

  describe ".distribution_frequencies" do
    it "returns all frequency values" do
      expect(described_class.distribution_frequencies).to eq(NotificationDistributionFrequencies.all)
    end
  end

  describe ".distribution_frequencies_for_select" do
    it "returns options for select" do
      expect(described_class.distribution_frequencies_for_select).to eq(NotificationDistributionFrequencies.options_for_select)
    end
  end

  describe "#immediate?" do
    it "returns true when distribution_frequency is immediate" do
      instance = build(described_class.to_s.underscore.to_sym, distribution_frequency: "immediate")
      expect(instance.immediate?).to be true
    end

    it "returns false when distribution_frequency is not immediate" do
      instance = build(described_class.to_s.underscore.to_sym, distribution_frequency: "summarized_hourly")
      expect(instance.immediate?).to be false
    end
  end

  describe "#summarized_hourly?" do
    it "returns true when distribution_frequency is summarized_hourly" do
      instance = build(described_class.to_s.underscore.to_sym, distribution_frequency: "summarized_hourly")
      expect(instance.summarized_hourly?).to be true
    end

    it "returns false when distribution_frequency is not summarized_hourly" do
      instance = build(described_class.to_s.underscore.to_sym, distribution_frequency: "immediate")
      expect(instance.summarized_hourly?).to be false
    end
  end

  describe "#summarized_daily?" do
    it "returns true when distribution_frequency is summarized_daily" do
      instance = build(described_class.to_s.underscore.to_sym, distribution_frequency: "summarized_daily")
      expect(instance.summarized_daily?).to be true
    end

    it "returns false when distribution_frequency is not summarized_daily" do
      instance = build(described_class.to_s.underscore.to_sym, distribution_frequency: "immediate")
      expect(instance.summarized_daily?).to be false
    end
  end
end
