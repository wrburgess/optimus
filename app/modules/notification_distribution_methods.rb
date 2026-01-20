module NotificationDistributionMethods
  EMAIL = "email".freeze
  SMS = "sms".freeze
  CHAT = "chat".freeze

  def self.all
    [
      EMAIL,
      SMS,
      CHAT
    ]
  end

  def self.options_for_select
    all.map { |item| [ item.titleize, item ] }
  end
end
