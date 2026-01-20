module NotificationDistributionFrequencies
  IMMEDIATE = "immediate".freeze
  SUMMARIZED_HOURLY = "summarized_hourly".freeze
  SUMMARIZED_DAILY = "summarized_daily".freeze

  def self.all
    [
      IMMEDIATE,
      SUMMARIZED_HOURLY,
      SUMMARIZED_DAILY
    ]
  end

  def self.options_for_select
    all.map { |item| [ item.titleize, item ] }
  end
end
