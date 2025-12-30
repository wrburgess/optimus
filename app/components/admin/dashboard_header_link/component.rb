class Admin::DashboardHeaderLink::Component < ApplicationComponent
  DEFAULT_BUTTON_CLASSES = {
    new: 'btn btn-success',
    edit: 'btn btn-secondary',
    archive: 'btn btn-warning',
    unarchive: 'btn btn-warning',
    download: 'btn btn-info'
  }.freeze

  DEFAULT_ICON_CLASSES = {
    new: 'bi bi-plus-circle',
    edit: 'bi bi-pencil',
    archive: 'bi bi-archive',
    unarchive: 'bi bi-arrow-counterclockwise',
    download: 'bi bi-file-spreadsheet'
  }.freeze

  def initialize(instance:, type:, **options)
    @instance = instance
    @type = get_type(type)
    @options = options
  end

  def render?
    case @type
    when :archive
      Pundit.policy(current_user, @instance).destroy? && @instance.unarchived?
    when :unarchive
      Pundit.policy(current_user, @instance).unarchive? && @instance.archived?
    when :download
      Pundit.policy(current_user, @instance).export_xlsx?
    else
      Pundit.policy(current_user, @instance).send("#{@type}?")
    end
  end

  def element_content
    icon_classes = @options[:icon_classes] || DEFAULT_ICON_CLASSES[@type]
    content = @type.to_s.upcase_first
    content = "#{content_tag(:i, nil, class: "me-2 #{icon_classes}")} #{content}"

    content.html_safe
  end

  def link_classes
    default_classes = @options[:default_classes] || DEFAULT_BUTTON_CLASSES[@type]
    [default_classes, @options[:additional_classes]].join(' ')
  end

  def additional_options
    options = @options[:additional_options] || {}

    if @type == :archive
      options.merge!(method: :delete, data: { confirm: 'Are you sure you want to archive this record?' })
    elsif @type == :unarchive
      options.merge!(method: :patch, data: { confirm: 'Are you sure you want to unarchive this record?' })
    end

    options
  end

  def path
    case @type
    when :new
      new_polymorphic_path([:admin, @instance])
    when :edit
      edit_polymorphic_path([:admin, @instance])
    when :unarchive
      polymorphic_path([:admin, @instance], action: :unarchive)
    when :download
      polymorphic_path([:admin, @instance], action: :export_xlsx)
    else
      polymorphic_path([:admin, @instance])
    end
  end

  # private

  def get_type(type)
    return type unless type == :archive

    @instance.respond_to?(:unarchived?) && @instance.unarchived? ? :archive : :unarchive
  end
end
