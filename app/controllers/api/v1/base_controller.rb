module Api
  module V1
    class BaseController < ApplicationController
      protect_from_forgery with: :exception

      private

      def session_token
        session[:writer_token] || (session[:writer_token] = SecureRandom.uuid)
      end

      def render_json(data, status: :ok)
        render json: data, status: status
      end

      def render_error(message, status: :unprocessable_entity)
        render json: { error: message }, status: status
      end
    end
  end
end
