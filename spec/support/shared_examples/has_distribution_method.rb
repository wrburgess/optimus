RSpec.shared_examples "has_distribution_method" do
  describe "validations from HasDistributionMethod" do
    it { is_expected.to validate_presence_of(:distribution_method) }
    it { is_expected.to validate_inclusion_of(:distribution_method).in_array(NotificationDistributionMethods.all) }
  end

  describe ".distribution_methods" do
    it "returns all method values" do
      expect(described_class.distribution_methods).to eq(NotificationDistributionMethods.all)
    end
  end

  describe ".distribution_methods_for_select" do
    it "returns options for select" do
      expect(described_class.distribution_methods_for_select).to eq(NotificationDistributionMethods.options_for_select)
    end
  end
end
