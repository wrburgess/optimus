class Admin::SystemPermissionsController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result)
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:users, :system_groups, :system_roles).find(params[:id])
  end

  def new
    @instance = controller_class.new
  end

  def create
    instance = controller_class.create(create_params)
    instance.update_associations(params)

    if instance.persisted?
      instance.log(user: current_user, operation: action_name, meta: params.to_json)
      instance.notify_topic("system_permission.created", context: { system_permission: instance, created_by: current_user })
      flash[:success] = "New #{instance.class_name_title} successfully created"
      redirect_to polymorphic_path([ :admin, instance ])
    else
      @instance = instance
      flash.now[:error] = instance.errors.full_messages.to_sentence
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @instance = controller_class.find(params[:id])
  end

  def update
    instance = controller_class.find(params[:id])
    original_instance = instance.dup

    instance.update(update_params)
    instance.update_associations(params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json, original_data: original_instance.attributes.to_json)
    flash[:success] = "#{instance.class_name_title} successfully updated"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def destroy
    instance = controller_class.find(params[:id])

    instance.log(user: current_user, operation: action_name)
    flash[:danger] = "#{instance.class_name_title} successfully deleted"

    instance.destroy

    redirect_to polymorphic_path([ :admin, controller_class ])
  end

  def copy
    instance = controller_class.find(params[:id])
    new_instance = instance.copy_with_associations

    instance.log(user: current_user, operation: action_name, meta: params.to_json)
    flash[:danger] = "#{new_instance.class_name_title} successfully duplicated"
    redirect_to polymorphic_path([ :admin, new_instance ])
  end

  def collection_export_xlsx
    sql = %(
      SELECT
        *
      FROM
        system_permissions
      ORDER BY
        system_permissions.id;
    )

    @results = ActiveRecord::Base.connection.select_all(sql)
    file_name = controller_class_plural

    send_data(
      render_to_string(
        template: "admin/xlsx/reports",
        formats: [ :xlsx ],
        handlers: [ :axlsx ],
        layout: false
      ),
      filename: helpers.file_name_with_timestamp(file_name: file_name, file_extension: "xlsx"),
      type: Mime[:xlsx]
    )
  end

  private

  def create_params
    params.require(controller_class_symbolized).permit(
      :abbreviation,
      :description,
      :name,
      :notes,
      :operation,
      :resource,
    )
  end

  def update_params
    params.require(controller_class_symbolized).permit(
      :abbreviation,
      :description,
      :name,
      :notes,
      :operation,
      :resource,
    )
  end
end
