class SetupAccountStructure < ActiveRecord::Migration[8.1]
  def change
    create_table :accounts do |t|
      t.string :name, null: false
      t.datetime :archived_at

      t.timestamps
    end

    create_table :account_users do |t|
      t.references :account, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
    add_index :account_users, [ :account_id, :user_id ], unique: true

    create_table :teams do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.datetime :archived_at

      t.timestamps
    end

    create_table :team_users do |t|
      t.references :team, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role, null: false, default: "member"

      t.timestamps
    end
    add_index :team_users, [ :team_id, :user_id ], unique: true
  end
end
