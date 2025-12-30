class Admin::UsersController < AdminController
  include Pagy::Method

  before_action :authenticate_user!

  def index
    authorize(controller_class)
    @q = controller_class.actives.ransack(params[:q])
    @q.sorts = ['last_name asc', 'created_at desc'] if @q.sorts.empty?

    @pagy, @instances = pagy(@q.result)
    @instance = controller_class.new
  end

  def show
    authorize(controller_class)
    @instance = controller_class.find(params[:id])
  end

  def new
    authorize(controller_class)
    @instance = controller_class.new
  end

  def create
    authorize(controller_class)
    temp_pw = SecureRandom.hex(16)
    params[:user][:password] = temp_pw
    params[:user][:password_confirmation] = temp_pw
    params[:user][:confirmed_at] = DateTime.current
    instance = controller_class.create(create_params)

    instance.log(user: current_user, operation: action_name, meta: params.to_json)
    flash[:success] = "New #{instance.class_name_title} successfully created"
    redirect_to polymorphic_path([:admin, instance])
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

    instance.log(user: current_user, operation: action_name, meta: params.to_json, original_data: original_instance.attributes.to_json)
    flash[:success] = "#{instance.class_name_title} successfully updated"
    redirect_to polymorphic_path([:admin, instance])
  end

  def destroy
    authorize(controller_class)
    instance = controller_class.find(params[:id])
    instance.archive

    instance.log(user: current_user, operation: action_name)
    flash[:danger] = "#{instance.class_name_title} successfully deleted"
    redirect_to polymorphic_path([:admin, controller_class])
  end

  def collection_export_xlsx
    authorize(controller_class)

    sql = %(
      SELECT
        users.id AS id,
        users.first_name AS first_name,
        users.last_name AS last_name,
        users.email AS email,
        users.notes AS notes
      FROM
        users
      WHERE
        users.archived_at IS NULL
      ORDER BY
        users.last_name ASC
    )

    @results = ActiveRecord::Base.connection.select_all(sql)
    file_name = controller_class_plural

    send_data(
      render_to_string(
        template: 'admin/xlsx/reports',
        formats: [:xlsx],
        handlers: [:axlsx],
        layout: false
      ),
      filename: helpers.file_name_with_timestamp(file_name: file_name, file_extension: 'xlsx'),
      type: Mime[:xlsx]
    )
  end

  def impersonate
    authorize(controller_class)
    user = User.find(params[:id])

    impersonate_user(user)

    user.log(user: true_user, operation: action_name, meta: user.to_json)
    redirect_to impersonation_status_path
  end

  def stop_impersonating
    authorize(controller_class)

    current_user.log(user: true_user, operation: action_name, meta: current_user.to_json)
    stop_impersonating_user
    redirect_to root_path
  end

  private

  def create_params
    params.require(:user).permit(
      :archived_at,
      :confirmed_at,
      :email,
      :first_name,
      :middle_name,
      :last_name,
      :notes,
      :password,
      :password_confirmation,
    )
  end

  def update_params
    params.require(:user).permit(
      :archived_at,
      :confirmed_at,
      :email,
      :first_name,
      :last_name,
      :middle_name,
      :notes,
    )
  end
end
