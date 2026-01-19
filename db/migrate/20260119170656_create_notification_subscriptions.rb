class CreateNotificationSubscriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_subscriptions do |t|
      t.references :notification_topic, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :distribution_method, null: false
      t.string :distribution_frequency, null: false
      t.integer :summarized_daily_hour
      t.boolean :active, default: true
      t.datetime :archived_at

      t.timestamps
    end

    add_index :notification_subscriptions, [:notification_topic_id, :user_id, :distribution_method],
              unique: true,
              name: "index_notification_subscriptions_on_topic_user_method"
  end
end
