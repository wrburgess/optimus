class Admin::NotificationTemplatesController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result.includes(:notification_topic))
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_topic).find(params[:id])
  end

  def new
    @instance = controller_class.new
  end

  def create
    instance = controller_class.create(create_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json)
    flash[:success] = "New #{instance.class_name_title} successfully created"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def edit
    @instance = controller_class.find(params[:id])
  end

  def update
    instance = controller_class.find(params[:id])
    original_instance = instance.dup

    instance.update(update_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json, original_data: original_instance.attributes.to_json)
    flash[:success] = "#{instance.class_name_title} successfully updated"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  private

  def create_params
    params.require(controller_class_symbolized).permit(
      :notification_topic_id,
      :distribution_method,
      :subject_template,
      :body_template,
      :active
    )
  end

  def update_params
    params.require(controller_class_symbolized).permit(
      :notification_topic_id,
      :distribution_method,
      :subject_template,
      :body_template,
      :active
    )
  end
end
