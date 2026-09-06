Rails.application.routes.draw do
  root "sessions#new"
  resource :session, only: [:new, :create, :destroy]
  resources :orders, only: [:index, :show] do
    patch :reschedule, on: :member
  end
end
