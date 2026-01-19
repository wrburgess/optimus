module NotificationDistributionMethods
  extend ActiveSupport::Concern

  METHODS = %w[email sms chat].freeze

  EMAIL = "email".freeze
  SMS = "sms".freeze
  CHAT = "chat".freeze

  included do
    validates :distribution_method, presence: true, inclusion: { in: METHODS }
  end

  class_methods do
    def distribution_methods
      METHODS
    end

    def distribution_methods_for_select
      METHODS.map { |method| [ method.titleize, method ] }
    end
  end
end
