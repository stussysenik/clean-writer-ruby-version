class CreateThemeOverrides < ActiveRecord::Migration[8.1]
  def change
    create_table :theme_overrides, id: :uuid do |t|
      t.string :session_token, null: false
      t.uuid :theme_id, null: false
      t.jsonb :color_overrides, default: {}
      t.jsonb :rhyme_color_overrides, default: {}

      t.timestamps
    end

    add_index :theme_overrides, [:session_token, :theme_id], unique: true
    add_foreign_key :theme_overrides, :themes
  end
end
