Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = false
  config.consider_all_requests_local = true
  config.action_dispatch.show_exceptions = :rescuable
  config.action_controller.perform_caching = false
  config.action_controller.allow_forgery_protection = ENV["DOGFOOD_BROWSER"] == "1"
  config.active_support.deprecation = :stderr
end
