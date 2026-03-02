module Api
  module V1
    class SettingsController < BaseController
      def show
        render_json current_settings.as_json(except: [:session_token])
      end

      def update
        settings = current_settings
        if settings.update(settings_params)
          render_json settings.as_json(except: [:session_token])
        else
          render_error settings.errors.full_messages.join(", ")
        end
      end

      private

      def current_settings
        UserSetting.find_or_create_by!(session_token: session_token) do |s|
          s.active_theme_slug = "classic"
          s.theme_order = []
          s.hidden_theme_ids = []
          s.has_seen_syntax_panel = false
          s.mobile_welcome_seen = false
          s.rhyme_highlight_radius = 4
          s.rhyme_bold_enabled = true
          s.custom_theme_names = {}
        end
      end

      def settings_params
        params.expect(settings: [
          :active_theme_slug, :has_seen_syntax_panel, :mobile_welcome_seen,
          :rhyme_highlight_radius, :rhyme_bold_enabled,
          theme_order: [], hidden_theme_ids: [], custom_theme_names: {}
        ])
      end
    end
  end
end
