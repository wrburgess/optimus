module AccountRoles
  ADMIN = "admin".freeze
  USER = "user".freeze
  MANAGER = "manager".freeze
  BILLING = "billing".freeze

  def self.options_for_select
    [
      [ self.ADMIN.titleize, self::ADMIN ],
      [ self.USER.titleize, self::USER ],
      [ self.MANAGER.titleize, self::MANAGER ],
      [ self.BILLING.titleize, self::BILLING ]
    ]
  end

  def self.all
    [ self::ADMIN, self::USER, self::MANAGER, self::BILLING ]
  end
end
