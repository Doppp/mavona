require_relative "boot"
require "rails"
require "active_record/railtie"
require "action_controller/railtie"
require "action_view/railtie"
Bundler.require(*Rails.groups)
module RailsDogfood
  class Application < Rails::Application
    config.load_defaults 8.1
    raise "Dogfood fixture requires explicit RAILS_ENV=test" unless Rails.env.test?
    raise "External database configuration is forbidden" if ENV.key?("DATABASE_URL")
    config.secret_key_base = SecureRandom.hex(64)
    config.hosts = ["127.0.0.1", "localhost", "www.example.com"]
    config.filter_parameters += [:authenticity_token, :password, :token, :authorization, :cookie]
    config.active_record.schema_format = :ruby
  end
end
