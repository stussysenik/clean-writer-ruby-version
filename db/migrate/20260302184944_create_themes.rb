class CreateThemes < ActiveRecord::Migration[8.1]
  def change
    create_table :themes, id: :uuid do |t|
      t.string :slug, null: false
      t.string :name, null: false
      t.string :theme_type, null: false, default: "preset"
      t.string :text_color, null: false
      t.string :background_color, null: false
      t.jsonb :highlight_colors, default: {}
      t.string :accent_color
      t.string :cursor_color
      t.string :strikethrough_color
      t.string :selection_color
      t.jsonb :rhyme_colors, default: []
      t.integer :position, default: 0
      t.boolean :hidden, default: false
      t.string :session_token

      t.timestamps
    end

    add_index :themes, :slug
    add_index :themes, :session_token
    add_index :themes, [:theme_type, :position]
  end
end
