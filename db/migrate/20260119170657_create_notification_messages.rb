class CreateNotificationMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_messages do |t|
      t.references :notification_topic, null: false, foreign_key: true
      t.string :subject
      t.text :body
      t.jsonb :metadata, default: {}

      t.timestamps
    end
  end
end
