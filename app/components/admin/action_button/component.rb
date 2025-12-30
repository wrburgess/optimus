class Admin::ActionButton::Component < ApplicationComponent
  def initialize(operation:, instance:, method: nil, path: nil, text: nil, button_classes: nil, classes_append: nil, icon_classes: nil, public: nil)
    @button_classes = button_classes
    @classes_append = classes_append
    @icon_classes = icon_classes
    @instance = instance
    @method = method
    @operation = operation
    @path = path
    @text = text
    @public = public
  end

  def content
    "#{helpers.content_tag(:i, nil, class: icon_class_list)} #{button_text}".html_safe
  end

  def button_text
    return @text if @text.present?

    texts = {
      archive: 'Archive',
      cancel_to_index: 'Cancel',
      cancel_to_show: 'Cancel',
      collection_export_xlsx: 'Download',
      copy: 'Create Duplicate',
      destroy: 'Delete',
      edit: 'Edit',
      index: 'View List',
      member_export_xlsx: 'Download',
      new: 'Create New',
      show: 'View',
      unarchive: 'Unarchive',
      upload: 'Import Flat File',
      upload_new: 'Upload New'
    }

    texts[@operation] || 'Submit'
  end

  def button_class_list
    return "#{@button_classes} #{@classes_append}" if @button_classes.present? && @classes_append.present?
    return @button_classes if @button_classes.present?
    return '' if @button_classes == :none

    classes = {
      archive: 'btn btn-danger',
      cancel_to_index: 'btn btn-secondary',
      cancel_to_show: 'btn btn-secondary',
      copy: 'btn btn-success',
      destroy: 'btn btn-danger',
      edit: 'btn btn-warning',
      export_xlsx: 'btn btn-info',
      index: 'btn btn-primary',
      new: 'btn btn-success',
      show: 'btn btn-info',
      unarchive: 'btn btn-secondary',
      upload: 'btn btn-info',
      upload_new: 'btn btn-success',
      user_export_xlsx: 'btn btn-info'
    }

    base_class = classes[@operation] || 'btn btn-secondary'
    base_class += " #{@classes_append}" if @classes_append.present?
    base_class
  end

  def icon_class_list
    return @icon_classes if @icon_classes.present?
    return '' if @icon_classes == :none

    classes = {
      archive: 'bi bi-archive',
      cancel_to_index: 'bi bi-x-octagon',
      cancel_to_show: 'bi bi-x-octagon',
      collection_export_xlsx: 'bi-file-spreadsheet',
      copy: 'bi bi-front',
      destroy: 'bi bi-x-circle',
      edit: 'bi bi-pencil',
      index: 'bi-list-ul',
      member_export_xlsx: 'bi-file-spreadsheet',
      new: 'bi bi-plus-circle',
      show: 'bi bi-eyeglasses',
      unarchive: 'bi bi-arrow-up-square-fill',
      upload: 'bi bi-eyeglasses',
      upload_new: 'bi bi-plus-circle'
    }

    classes[@operation] || 'bi bi-1-circle-fill'
  end

  def url_path
    return @path if @path.present?

    case @operation
    when :archive
      polymorphic_path([:archive, :admin, @instance])
    when :cancel_to_index
      polymorphic_path([:admin, @instance.class])
    when :cancel_to_show
      polymorphic_path([:admin, @instance])
    when :collection_export_xlsx
      polymorphic_path([:export_xlsx, :admin, @instance.class])
    when :copy
      polymorphic_path([:copy, :admin, @instance])
    when :destroy
      polymorphic_path([:admin, @instance], method: :delete)
    when :edit
      edit_polymorphic_path([:admin, @instance])
    when :index
      polymorphic_path([:admin, @instance.class])
    when :member_export_xlsx
      polymorphic_path([:export_xlsx, :admin, @instance])
    when :new
      new_polymorphic_path([:admin, @instance.class])
    when :show
      polymorphic_path([:admin, @instance])
    when :unarchive
      polymorphic_path([:unarchive, :admin, @instance])
    when :upload
      polymorphic_path([:upload, :admin, @instance])
    when :upload_new
      new_polymorphic_path([:admin, @instance.class])
    else
      '/'
    end
  end

  def turbo_active
    if @operation == :collection_export_xlsx || @operation == :member_export_xlsx
      false
    else
      true
    end
  end

  def method_type
    return @method if @method.present?

    paths = {
      archive: :patch,
      cancel_to_show: :get,
      copy: :post,
      destroy: :delete,
      edit: :get,
      export_xlsx: :get,
      index: :get,
      new: :get,
      show: :get,
      unarchive: :patch,
      upload: :get,
      upload_new: :get,
      user_export_xlsx: :get
    }

    paths[@operation] || :get
  end

  def render?
    authorized
  end

  private

  def authorized
    return true if @public

    # Use admin-namespaced policy for admin components
    policy_target = [:admin, @instance.class]

    policy(policy_target).respond_to?("#{@operation}?") && policy(policy_target).send("#{@operation}?")
  end
end
