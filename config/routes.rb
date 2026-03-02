Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # API
  namespace :api do
    namespace :v1 do
      resources :documents, only: [:index, :create, :update] do
        member do
          patch :autosave
        end
      end
      resources :themes, only: [:index, :create, :update, :destroy] do
        collection do
          patch :reorder
        end
      end
      resource :settings, only: [:show, :update]
      resource :export, only: [] do
        post :markdown
      end
    end
  end

  # SPA — catch-all route sends everything to React
  root "pages#show"
  get "*path", to: "pages#show", constraints: ->(req) { !req.xhr? && req.format.html? }
end
