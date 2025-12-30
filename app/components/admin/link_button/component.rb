class Admin::LinkButton::Component < ApplicationComponent
  def initialize(path:, text: nil, button_classes: "btn btn-light", public: true)
    @button_classes = button_classes
    @path = path
    @public = public
    @text = text
  end

  def render?
    @public
  end
end
