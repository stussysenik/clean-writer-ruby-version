module Api
  module V1
    class ExportsController < BaseController
      def markdown
        content = params[:content] || ""
        filename = params[:filename] || "nerv-writer-export.md"

        send_data content,
          filename: filename,
          type: "text/markdown",
          disposition: "attachment"
      end
    end
  end
end
