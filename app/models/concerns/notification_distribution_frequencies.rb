module NotificationDistributionFrequencies
  extend ActiveSupport::Concern

  FREQUENCIES = %w[immediate summarized_hourly summarized_daily].freeze

  IMMEDIATE = "immediate".freeze
  SUMMARIZED_HOURLY = "summarized_hourly".freeze
  SUMMARIZED_DAILY = "summarized_daily".freeze

  included do
    validates :distribution_frequency, presence: true, inclusion: { in: FREQUENCIES }
  end

  class_methods do
    def distribution_frequencies
      FREQUENCIES
    end

    def distribution_frequencies_for_select
      FREQUENCIES.map { |freq| [ freq.titleize, freq ] }
    end
  end

  def immediate?
    distribution_frequency == IMMEDIATE
  end

  def summarized_hourly?
    distribution_frequency == SUMMARIZED_HOURLY
  end

  def summarized_daily?
    distribution_frequency == SUMMARIZED_DAILY
  end
end
