class Admin::DataLogsController < AdminController
  include Pagy::Method

  before_action :authenticate_user!
  before_action :authorize_user

  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result)
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.find(params[:id])
  end

  def collection_export_xlsx
    sql = %(
      SELECT
        data_logs.id,
        CONCAT(users.first_name, ' ', users.last_name) AS user,
        UPPER(data_logs.action_type) AS action,
        data_logs.loggable_type AS model,
        data_logs.loggable_id AS model_id,
        data_logs.created_at AT TIME ZONE 'America/Chicago' AS created_at
      FROM
        data_logs
      LEFT JOIN
        users ON data_logs.user_id = users.id
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

  def authorize_user
    authorize([ :admin, controller_class ])
  end
end
