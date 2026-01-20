module HasDistributionFrequency
  extend ActiveSupport::Concern

  included do
    validates :distribution_frequency, presence: true, inclusion: { in: NotificationDistributionFrequencies.all }
  end

  class_methods do
    def distribution_frequencies
      NotificationDistributionFrequencies.all
    end

    def distribution_frequencies_for_select
      NotificationDistributionFrequencies.options_for_select
    end
  end

  def immediate?
    distribution_frequency == NotificationDistributionFrequencies::IMMEDIATE
  end

  def summarized_hourly?
    distribution_frequency == NotificationDistributionFrequencies::SUMMARIZED_HOURLY
  end

  def summarized_daily?
    distribution_frequency == NotificationDistributionFrequencies::SUMMARIZED_DAILY
  end
end
