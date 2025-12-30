module SystemOperations
  ARCHIVED = "archived".freeze
  COLLECTION_EXPORT_XLSX = "collection_export_xlsx".freeze
  COPY = "copy".freeze
  CREATE = "create".freeze
  CREATE_FROM_UPLOAD = "create_from_upload".freeze
  DELETED = "deleted".freeze
  DISASSOCIATE = "disassociate".freeze
  EDIT = "edit".freeze
  EXPORT_IMPORT_EXAMPLE = "export_import_example".freeze
  IMPORT = "import".freeze
  INDEX = "index".freeze
  MEMBER_EXPORT_XLSX = "member_export_xlsx".freeze
  NEW = "new".freeze
  READ = "read".freeze
  SHARE = "share".freeze
  SHOW = "show".freeze
  UNARCHIVED = "unarchived".freeze
  UPDATE = "update".freeze
  UPLOAD = "upload".freeze

  def self.options_for_select
    all.map { |item| [ item.upcase, item ] }
  end

  def self.all
    constants.map(&:to_s).map(&:downcase).sort
  end
end
