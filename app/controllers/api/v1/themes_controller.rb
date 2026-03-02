module Api
  module V1
    class ThemesController < BaseController
      before_action :set_theme, only: [:update, :destroy]

      def index
        presets = Theme.presets
        customs = Theme.for_session(session_token)
        render_json (presets + customs).as_json(except: [:session_token])
      end

      def create
        theme = Theme.new(theme_params.merge(
          session_token: session_token,
          theme_type: "custom",
          position: Theme.for_session(session_token).count + Theme.presets.count
        ))
        if theme.save
          render_json theme.as_json(except: [:session_token]), status: :created
        else
          render_error theme.errors.full_messages.join(", ")
        end
      end

      def update
        if @theme.update(theme_params)
          render_json @theme.as_json(except: [:session_token])
        else
          render_error @theme.errors.full_messages.join(", ")
        end
      end

      def destroy
        if @theme.theme_type == "preset"
          render_error "Cannot delete preset themes", status: :forbidden
        else
          @theme.destroy!
          head :no_content
        end
      end

      def reorder
        positions = params.expect(:positions)
        positions.each do |item|
          Theme.where(id: item[:id]).update_all(position: item[:position])
        end
        head :ok
      end

      private

      def set_theme
        @theme = Theme.find_by!(id: params[:id])
        unless @theme.theme_type == "preset" || @theme.session_token == session_token
          render_error "Theme not found", status: :not_found
        end
      rescue ActiveRecord::RecordNotFound
        render_error "Theme not found", status: :not_found
      end

      def theme_params
        params.expect(theme: [
          :slug, :name, :text_color, :background_color,
          :accent_color, :cursor_color, :strikethrough_color, :selection_color,
          :hidden, :position,
          highlight_colors: {}, rhyme_colors: []
        ])
      end
    end
  end
end
