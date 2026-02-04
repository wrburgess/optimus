class Admin::NotificationQueueItemsController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result.includes(:user))
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_message, :notification_subscription, :user).find(params[:id])
  end

  def collection_export_xlsx
    sql = %(
      SELECT
        notification_queue_items.*,
        users.email as user_email,
        notification_messages.subject as message_subject
      FROM
        notification_queue_items
      LEFT JOIN users ON notification_queue_items.user_id = users.id
      LEFT JOIN notification_messages ON notification_queue_items.notification_message_id = notification_messages.id
      ORDER BY
        notification_queue_items.id DESC;
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
end
