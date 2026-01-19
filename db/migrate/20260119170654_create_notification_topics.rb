class CreateNotificationTopics < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_topics do |t|
      t.string :name, null: false
      t.string :key, null: false
      t.text :description
      t.datetime :archived_at

      t.timestamps
    end

    add_index :notification_topics, :key, unique: true
  end
end
