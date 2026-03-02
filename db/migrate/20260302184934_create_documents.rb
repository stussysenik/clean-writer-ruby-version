class CreateDocuments < ActiveRecord::Migration[8.1]
  def change
    enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")

    create_table :documents, id: :uuid do |t|
      t.text :content, default: ""
      t.integer :word_count, default: 0
      t.string :view_mode, default: "write"
      t.integer :max_width, default: 720
      t.string :font_id, default: "inter"
      t.integer :font_size_offset, default: 0
      t.jsonb :highlight_config, default: {}
      t.boolean :solo_mode, default: false
      t.boolean :song_mode, default: false
      t.boolean :show_syllable_annotations, default: false
      t.boolean :utf8_display_enabled, default: false
      t.string :session_token, null: false

      t.timestamps
    end

    add_index :documents, :session_token
  end
end
