class Admin::Brand::Component < ApplicationComponent
  def initialize(brand_name: 'Harvest Admin', environment_name: 'development', classes: 'navbar-brand')
    @brand_name = brand_name
    @environment_name = environment_name
    @classes = classes
  end

  def style
    {
      brand: {
        base: @classes || 'navbar-brand'
      },
      brand_name: {
        base: 'brand-name'
      },
      environment_label: {
        base: 'environment-label m-1'
      }
    }
  end

  def environment_label
    case @environment_name
    when 'review'
      'REVIEW'
    when 'development'
      'DEV'
    when 'staging'
      'STAGING'
    end
  end
end
