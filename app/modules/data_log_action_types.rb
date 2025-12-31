module DataLogActionTypes
  ARCHIVED = "archived".freeze
  CREATED = "created".freeze
  DELETED = "deleted".freeze
  DUPLICATED = "duplicated".freeze
  SHARED = "shared".freeze
  SYNC_ON_GARDEN = "sync on garden".freeze
  UPDATED = "updated".freeze
  UPDATED_BY_COPY = "updated by copy".freeze
  VIEWED = "viewed".freeze

  def self.all
    [
      DataLogActionTypes::ARCHIVED,
      DataLogActionTypes::CREATED,
      DataLogActionTypes::DELETED,
      DataLogActionTypes::DUPLICATED,
      DataLogActionTypes::SHARED,
      DataLogActionTypes::SYNC_ON_GARDEN,
      DataLogActionTypes::UPDATED,
      DataLogActionTypes::UPDATED_BY_COPY,
      DataLogActionTypes::VIEWED
    ]
  end

  def self.options_for_select
    all.map { |item| [ item.titleize, item ] }
  end
end
