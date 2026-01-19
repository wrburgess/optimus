class Admin::NotificationSubscriptionsController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result.includes(:notification_topic, :user))
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_topic, :user).find(params[:id])
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

  def collection_export_xlsx
    sql = %(
      SELECT
        notification_subscriptions.*,
        notification_topics.name as topic_name,
        users.email as user_email
      FROM
        notification_subscriptions
      LEFT JOIN notification_topics ON notification_subscriptions.notification_topic_id = notification_topics.id
      LEFT JOIN users ON notification_subscriptions.user_id = users.id
      ORDER BY
        notification_subscriptions.id;
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
      :notification_topic_id,
      :user_id,
      :distribution_method,
      :distribution_frequency,
      :summarized_daily_hour,
      :active
    )
  end

  def update_params
    params.require(controller_class_symbolized).permit(
      :notification_topic_id,
      :user_id,
      :distribution_method,
      :distribution_frequency,
      :summarized_daily_hour,
      :active
    )
  end
end
