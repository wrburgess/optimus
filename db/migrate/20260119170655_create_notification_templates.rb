class CreateNotificationTemplates < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_templates do |t|
      t.references :notification_topic, null: false, foreign_key: true
      t.string :distribution_method, null: false
      t.string :subject_template
      t.text :body_template
      t.boolean :active, default: true
      t.datetime :archived_at

      t.timestamps
    end

    add_index :notification_templates, [:notification_topic_id, :distribution_method],
              unique: true,
              name: "index_notification_templates_on_topic_and_method"
  end
end
