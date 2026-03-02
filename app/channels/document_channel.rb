class DocumentChannel < ApplicationCable::Channel
  def subscribed
    stream_from "document_#{params[:session_token]}"
  end

  def receive(data)
    ActionCable.server.broadcast(
      "document_#{params[:session_token]}",
      data.merge("sender" => connection.connection_identifier)
    )
  end
end
