class Admin::FormButton::Component < ApplicationComponent
  def initialize(operation:, text: nil, button_classes: nil, classes_append: nil, icon_classes: nil, public: true)
    @button_classes = button_classes
    @classes_append = classes_append
    @icon_classes = icon_classes
    @operation = operation
    @text = text
    @public = public
  end

  def button_text
    return @text if @text.present?

    texts = {
      filter: 'Filter',
      submit: 'Submit'
    }

    texts[@operation] || 'Submit'
  end

  def button_class_list
    return "#{@button_classes} #{@classes_append}" if @button_classes.present? && @classes_append.present?
    return @button_classes if @button_classes.present?
    return '' if @button_classes == :none

    classes = {
      filter: 'btn btn-secondary',
      submit: 'btn btn-success'
    }

    base_class = classes[@operation] || 'btn btn-success'
    base_class += " #{@classes_append}" if @classes_append.present?
    base_class
  end

  def icon_class_list
    return @icon_classes if @icon_classes.present?
    return '' if @icon_classes == :none

    classes = {
      filter: 'bi bi-funnel',
      submit: 'bi bi-check-circle'
    }

    classes[@operation] || 'bi bi-check-circle'
  end

  def render?
    @public
  end
end
