module HasDistributionMethod
  extend ActiveSupport::Concern

  included do
    validates :distribution_method, presence: true, inclusion: { in: NotificationDistributionMethods.all }
  end

  class_methods do
    def distribution_methods
      NotificationDistributionMethods.all
    end

    def distribution_methods_for_select
      NotificationDistributionMethods.options_for_select
    end
  end
end
