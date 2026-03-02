class PagesController < ApplicationController
  def show
    ensure_session_token!

    @initial_state = {
      document: current_document_state,
      themes: theme_list,
      settings: current_settings
    }
  end

  private

  def ensure_session_token!
    session[:writer_token] ||= SecureRandom.uuid
  end

  def session_token
    session[:writer_token]
  end

  def current_document_state
    doc = Document.find_or_create_by!(session_token: session_token) do |d|
      d.content = ""
      d.word_count = 0
      d.view_mode = "write"
      d.max_width = 720
      d.font_id = "inter"
      d.font_size_offset = 0
      d.highlight_config = Document::DEFAULT_HIGHLIGHT_CONFIG
      d.solo_mode = false
      d.song_mode = false
      d.show_syllable_annotations = false
      d.utf8_display_enabled = false
    end
    doc.as_json(except: [:session_token, :created_at, :updated_at])
  end

  def theme_list
    presets = Theme.where(theme_type: "preset").order(:position)
    customs = Theme.where(session_token: session_token, theme_type: "custom").order(:position)
    (presets + customs).map { |t| t.as_json(except: [:session_token, :created_at, :updated_at]) }
  end

  def current_settings
    setting = UserSetting.find_or_create_by!(session_token: session_token) do |s|
      s.active_theme_slug = "classic"
      s.theme_order = []
      s.hidden_theme_ids = []
      s.has_seen_syntax_panel = false
      s.mobile_welcome_seen = false
      s.rhyme_highlight_radius = 4
      s.rhyme_bold_enabled = true
      s.custom_theme_names = {}
    end
    setting.as_json(except: [:session_token, :created_at, :updated_at])
  end
end
