module BooleanOptions
  ANY = "any".freeze
  YES = "yes".freeze
  NO = "no".freeze

  def self.options_for_select
    [
      [ BooleanOptions::ANY.titleize, BooleanOptions::ANY ],
      [ BooleanOptions::YES.titleize, BooleanOptions::YES ],
      [ BooleanOptions::NO.titleize, BooleanOptions::NO ]
    ]
  end

  def self.all
    [
      BooleanOptions::ANY,
      BooleanOptions::YES,
      BooleanOptions::NO
    ]
  end
end
