# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_02_184958) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "documents", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "content", default: ""
    t.datetime "created_at", null: false
    t.string "font_id", default: "inter"
    t.integer "font_size_offset", default: 0
    t.jsonb "highlight_config", default: {}
    t.integer "max_width", default: 720
    t.string "session_token", null: false
    t.boolean "show_syllable_annotations", default: false
    t.boolean "solo_mode", default: false
    t.boolean "song_mode", default: false
    t.datetime "updated_at", null: false
    t.boolean "utf8_display_enabled", default: false
    t.string "view_mode", default: "write"
    t.integer "word_count", default: 0
    t.index ["session_token"], name: "index_documents_on_session_token"
  end

  create_table "theme_overrides", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.jsonb "color_overrides", default: {}
    t.datetime "created_at", null: false
    t.jsonb "rhyme_color_overrides", default: {}
    t.string "session_token", null: false
    t.uuid "theme_id", null: false
    t.datetime "updated_at", null: false
    t.index ["session_token", "theme_id"], name: "index_theme_overrides_on_session_token_and_theme_id", unique: true
  end

  create_table "themes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "accent_color"
    t.string "background_color", null: false
    t.datetime "created_at", null: false
    t.string "cursor_color"
    t.boolean "hidden", default: false
    t.jsonb "highlight_colors", default: {}
    t.string "name", null: false
    t.integer "position", default: 0
    t.jsonb "rhyme_colors", default: []
    t.string "selection_color"
    t.string "session_token"
    t.string "slug", null: false
    t.string "strikethrough_color"
    t.string "text_color", null: false
    t.string "theme_type", default: "preset", null: false
    t.datetime "updated_at", null: false
    t.index ["session_token"], name: "index_themes_on_session_token"
    t.index ["slug"], name: "index_themes_on_slug"
    t.index ["theme_type", "position"], name: "index_themes_on_theme_type_and_position"
  end

  create_table "user_settings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "active_theme_slug", default: "classic"
    t.datetime "created_at", null: false
    t.jsonb "custom_theme_names", default: {}
    t.boolean "has_seen_syntax_panel", default: false
    t.jsonb "hidden_theme_ids", default: []
    t.boolean "mobile_welcome_seen", default: false
    t.boolean "rhyme_bold_enabled", default: true
    t.integer "rhyme_highlight_radius", default: 4
    t.string "session_token", null: false
    t.jsonb "theme_order", default: []
    t.datetime "updated_at", null: false
    t.index ["session_token"], name: "index_user_settings_on_session_token", unique: true
  end

  add_foreign_key "theme_overrides", "themes"
end
