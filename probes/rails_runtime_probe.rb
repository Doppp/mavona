# frozen_string_literal: true
# Executed only through explicitly approved Rails runner boot. No model Ruby is evaluated.
require 'json'
require 'pathname'
begin
  request = JSON.parse(ARGV.fetch(0))
  raise ArgumentError unless request.keys.sort == %w[models schemaVersion] && request['schemaVersion'] == 1
  names = request['models']
  raise ArgumentError unless names.is_a?(Array) && names.length <= 8 && names.uniq == names && names.all? { |name| name.is_a?(String) && name.match?(/\A[A-Z]\w*(?:::[A-Z]\w*)*\z/) && name.length <= 200 }
  raise ArgumentError unless Rails.env.test?
  clean = ->(value) { text = value.to_s; raise ArgumentError if text.bytesize > 1024 || text.match?(/[\x00-\x1f\x7f]/); text }
  routes = Rails.application.routes.routes.to_a
  models = names.map do |name|
    model = name.constantize
    raise ArgumentError unless model.is_a?(Class) && model < ActiveRecord::Base
    associations = model.reflect_on_all_associations
    columns = model.columns
    { name: name, table: clean.call(model.table_name), associations: associations.first(100).map { |a| {name: clean.call(a.name), kind: clean.call(a.macro), className: clean.call(a.class_name)} }, columns: columns.first(100).map { |c| {name: clean.call(c.name), type: clean.call(c.type), nullable: c.null} }, truncated: associations.length > 100 || columns.length > 100 }
  end
  paths = Rails.autoloaders.flat_map(&:dirs).filter_map do |path|
    relative = Pathname.new(File.realpath(path)).relative_path_from(Pathname.new(File.realpath(Rails.root))).to_s
    clean.call(relative) unless relative == '..' || relative.start_with?('../')
  end.uniq
  STDOUT.write(JSON.generate({schemaVersion: 1, kind: 'runtime_observation', status: 'passed', environment: 'test', railsVersion: Rails.version, rubyVersion: RUBY_VERSION, routes: routes.first(200).map { |route| {name: clean.call(route.name), verb: clean.call(route.verb), path: clean.call(route.path.spec), controller: clean.call(route.defaults[:controller]), action: clean.call(route.defaults[:action])} }, routesTruncated: routes.length > 200, models: models, loaderPaths: paths.first(100), pathsTruncated: paths.length > 100}))
rescue StandardError
  STDOUT.write(JSON.generate({schemaVersion: 1, kind: 'runtime_observation', status: 'unknown', reason: 'runtime_facts_unavailable'}))
end
