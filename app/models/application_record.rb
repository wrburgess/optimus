class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  def class_name_singular
    self.class.name.underscore
  end

  def class_name_plural
    self.class.name.underscore.pluralize
  end

  def class_name_title
    self.class.name.titleize
  end
end
