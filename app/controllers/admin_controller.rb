class AdminController < ApplicationController
  include Pagy::Method

  layout "admin"

  before_action :authenticate_user!
  before_action :authorize_user!

  def destroy
    @instance = @model_class.find(params[:id])
    authorize(@instance)

    @instance.archive!
    @instance.log(user: current_user, operation: action_nameD)
    flash[:danger] = "#{@instance.class_name_title} deleted"
    redirect_to polymorphic_path([ :admin, @model_class ])
  end

  def archive
    @instance = @model_class.find(params[:id])
    authorize(@instance)

    @instance.archive!
    @instance.log(user: current_user, operation: action_name)
    flash[:danger] = "#{@instance.class_name_title} archived"
    redirect_to polymorphic_path([ :admin, @model_class ])
  end

  def unarchive
    @instance = @model_class.find(params[:id])
    authorize(@instance)

    @instance.unarchive!
    @instance.log(user: current_user, operation: action_name)
    flash[:danger] = "#{@instance.class_name_title} unarchived"
    redirect_to polymorphic_path([ :admin, @instance ])
  end

  private

  def authorize_user!
    authorize([ :admin, controller_class ])
  end

  def policy_class
    "Admin::#{controller_name.classify}Policy".constantize
  end
end
