class CreateNotificationQueueItems < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_queue_items do |t|
      t.references :notification_subscription, null: false, foreign_key: true
      t.references :notification_message, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :distribution_method, null: false
      t.datetime :distribute_at, null: false
      t.datetime :distributed_at

      t.timestamps
    end

    add_index :notification_queue_items, [:distribute_at, :distributed_at],
              name: "index_notification_queue_items_on_distribute_distributed"
    add_index :notification_queue_items, [:user_id, :distribute_at],
              name: "index_notification_queue_items_on_user_distribute"
  end
end
