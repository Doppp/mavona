# frozen_string_literal: true

require "pathname"

module Mavona
  module Discovery
    class ComponentInventory
      PATTERNS = {
        "models" => ["app/models/**/*.rb"],
        "controllers" => ["app/controllers/**/*_controller.rb"],
        "jobs" => ["app/jobs/**/*_job.rb"],
        "mailers" => ["app/mailers/**/*_mailer.rb"],
        "channels" => ["app/channels/**/*_channel.rb"],
        "policies" => ["app/policies/**/*_policy.rb"],
        "services" => ["app/services/**/*.rb"],
        "forms" => ["app/forms/**/*.rb"],
        "queries" => ["app/queries/**/*.rb"],
        "presenters" => ["app/presenters/**/*.rb"],
        "components" => ["app/components/**/*.rb"],
        "concerns" => ["app/**/concerns/**/*.rb"],
        "routes" => ["config/routes.rb", "config/routes/**/*.rb"],
        "migrations" => ["db/migrate/*_*.rb"],
        "tests_specs" => ["test/**/*_test.rb", "spec/**/*_spec.rb"],
        "factories_fixtures" => ["test/fixtures/**/*", "spec/factories/**/*", "test/factories/**/*"],
        "initializers" => ["config/initializers/*.rb"],
        "engines" => ["lib/**/engine.rb", "engines/*/lib/**/engine.rb"],
        "rake_tasks" => ["lib/tasks/**/*.rake"]
      }.freeze

      def initialize(rails_root)
        @root = File.expand_path(rails_root)
      end

      def inspect
        inventory = PATTERNS.each_with_object({}) do |(name, patterns), result|
          paths = patterns.flat_map { |pattern| Dir.glob(File.join(@root, pattern)) }
            .select { |path| File.file?(path) }.map { |path| relative(path) }.uniq.sort
          paths.reject! { |path| path.include?("/concerns/") } if name == "models"
          result[name] = { "count" => paths.length, "paths" => paths }
        end
        inventory["schema_tables"] = schema_tables
        inventory["custom_autoload_eager_load_paths"] = custom_load_paths
        inventory
      end

      private

      def relative(path)
        Pathname.new(path).relative_path_from(Pathname.new(@root)).to_s
      end

      def schema_tables
        schema = ["db/schema.rb", "db/structure.sql"].find { |path| File.file?(File.join(@root, path)) }
        return { "count" => 0, "names" => [], "source" => "unknown" } unless schema

        content = File.read(File.join(@root, schema), encoding: "UTF-8")
        names = if schema.end_with?("schema.rb")
          content.scan(/create_table\s+["']([^"']+)/).flatten
        else
          content.scan(/CREATE TABLE(?: IF NOT EXISTS)?\s+(?:\w+\.)?["`]?([\w-]+)/i).flatten
        end
        { "count" => names.uniq.length, "names" => names.uniq.sort, "source" => schema }
      rescue Errno::EACCES, Encoding::InvalidByteSequenceError
        { "count" => 0, "names" => [], "source" => "unknown" }
      end

      def custom_load_paths
        files = ["config/application.rb"] + Dir.glob(File.join(@root, "config/environments/*.rb")).map { |path| relative(path) }
        entries = files.filter_map do |relative_path|
          path = File.join(@root, relative_path)
          next unless File.file?(path)

          File.readlines(path, chomp: true).each_with_index.filter_map do |line, index|
            next unless line.match?(/(?:autoload_paths|eager_load_paths)/)

            { "path" => relative_path, "line" => index + 1, "expression" => line.strip }
          end
        end.flatten
        { "count" => entries.length, "entries" => entries }
      end
    end
  end
end
