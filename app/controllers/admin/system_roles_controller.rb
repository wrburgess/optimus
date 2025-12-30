class Admin::SystemRolesController < AdminController
  include Pagy::Method

  before_action :authenticate_user!

  def index
    authorize(controller_class)
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result)
    @instance = controller_class.new
  end

  def show
    authorize(controller_class)
    @instance = controller_class.includes(:users, :system_groups, :system_permissions).find(params[:id])
  end

  def new
    authorize(controller_class)
    @instance = controller_class.new
  end

  def create
    authorize(controller_class)
    instance = controller_class.create(create_params)
    instance.update_associations(params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json)
    flash[:success] = "New #{instance.class_name_title} successfully created"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def edit
    authorize(controller_class)
    @instance = controller_class.find(params[:id])
  end

  def update
    authorize(controller_class)
    instance = controller_class.find(params[:id])
    original_instance = instance.dup

    instance.update(update_params)
    instance.update_associations(params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json, original_data: original_instance.attributes.to_json)
    flash[:success] = "#{instance.class_name_title} successfully updated"
    redirect_to polymorphic_path([ :admin, instance ])
  end

  def destroy
    authorize(controller_class)
    instance = controller_class.find(params[:id])

    instance.log(user: current_user, operation: action_name)
    flash[:danger] = "#{instance.class_name_title} successfully deleted"

    instance.destroy

    redirect_to polymorphic_path([ :admin, controller_class ])
  end

  def collection_export_xlsx
    authorize(controller_class)

    sql = %(
      SELECT
        *
      FROM
        system_roles
      ORDER BY
        system_roles.id;
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
    )
  end

  def update_params
    params.require(controller_class_symbolized).permit(
      :abbreviation,
      :description,
      :name,
      :notes,
    )
  end
end
