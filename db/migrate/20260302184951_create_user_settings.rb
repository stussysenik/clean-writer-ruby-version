class CreateUserSettings < ActiveRecord::Migration[8.1]
  def change
    create_table :user_settings, id: :uuid do |t|
      t.string :session_token, null: false
      t.string :active_theme_slug, default: "classic"
      t.jsonb :theme_order, default: []
      t.jsonb :hidden_theme_ids, default: []
      t.boolean :has_seen_syntax_panel, default: false
      t.boolean :mobile_welcome_seen, default: false
      t.integer :rhyme_highlight_radius, default: 4
      t.boolean :rhyme_bold_enabled, default: true
      t.jsonb :custom_theme_names, default: {}

      t.timestamps
    end

    add_index :user_settings, :session_token, unique: true
  end
end
