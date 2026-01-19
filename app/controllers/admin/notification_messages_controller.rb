class Admin::NotificationMessagesController < AdminController
  def index
    @q = controller_class.ransack(params[:q])
    @q.sorts = controller_class.default_sort if @q.sorts.empty?
    @pagy, @instances = pagy(@q.result.includes(:notification_topic))
    @instance = controller_class.new
  end

  def show
    @instance = controller_class.includes(:notification_topic, :notification_queue_items).find(params[:id])
  end

  def collection_export_xlsx
    sql = %(
      SELECT
        notification_messages.*,
        notification_topics.name as topic_name
      FROM
        notification_messages
      LEFT JOIN notification_topics ON notification_messages.notification_topic_id = notification_topics.id
      ORDER BY
        notification_messages.id DESC;
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
