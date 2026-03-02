module Api
  module V1
    class DocumentsController < BaseController
      before_action :set_document, only: [:update, :autosave]

      def index
        documents = Document.where(session_token: session_token)
        render_json documents.as_json(except: [:session_token])
      end

      def create
        document = Document.new(document_params.merge(session_token: session_token))
        if document.save
          render_json document.as_json(except: [:session_token]), status: :created
        else
          render_error document.errors.full_messages.join(", ")
        end
      end

      def update
        if @document.update(document_params)
          render_json @document.as_json(except: [:session_token])
        else
          render_error @document.errors.full_messages.join(", ")
        end
      end

      def autosave
        if @document.update(autosave_params)
          render_json({ id: @document.id, word_count: @document.word_count, updated_at: @document.updated_at })
        else
          render_error @document.errors.full_messages.join(", ")
        end
      end

      private

      def set_document
        @document = Document.find_by!(id: params[:id], session_token: session_token)
      rescue ActiveRecord::RecordNotFound
        render_error "Document not found", status: :not_found
      end

      def document_params
        params.expect(document: [
          :content, :word_count, :view_mode, :max_width, :font_id,
          :font_size_offset, :solo_mode, :song_mode,
          :show_syllable_annotations, :utf8_display_enabled,
          highlight_config: {}
        ])
      end

      def autosave_params
        params.expect(document: [:content, :word_count])
      end
    end
  end
end
