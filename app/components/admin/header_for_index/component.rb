class Admin::HeaderForIndex::Component < ApplicationComponent
  def initialize(
    instance:,
    action:,
    controller:,
    new_button: false,
    upload_new_button: false,
    upload_file_button: false,
    collection_export_xlsx_button: false,
    show_filtering: false
  )
    @instance = instance
    @action = action
    @controller = controller
    @new_button = new_button
    @upload_new_button = upload_new_button
    @upload_file_button = upload_file_button
    @collection_export_xlsx_button = collection_export_xlsx_button
    @show_filtering = show_filtering
  end

  def headline
    @instance.class.name.titleize.pluralize
  end

  def render?
    true
  end
end
