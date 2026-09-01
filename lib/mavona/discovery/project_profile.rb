# frozen_string_literal: true

module Mavona
  module Discovery
    class ProjectProfile
      UNKNOWN = "unknown"

      def initialize(rails_root)
        @root = File.expand_path(rails_root)
      end

      def inspect
        gemfile = read("Gemfile")
        lockfile = read("Gemfile.lock")
        application = read("config/application.rb")
        {
          "project_type" => "rails",
          "ruby_version" => ruby_version(gemfile),
          "rails_version" => dependency_version("rails", gemfile, lockfile),
          "bundler_version" => bundler_version(lockfile),
          "database_adapter" => database_adapter(gemfile, lockfile),
          "schema_format" => schema_format(application),
          "test_framework" => test_framework(gemfile, lockfile),
          "job_backend" => job_backend(application, gemfile, lockfile),
          "frontend_approach" => frontend_approach(gemfile, lockfile),
          "lint_security_tools" => tools(gemfile, lockfile),
          "ci_commands" => ci_commands,
          "safe_test_commands" => safe_test_commands(gemfile, lockfile),
          "safe_boot_commands" => safe_boot_commands
        }
      end

      private

      def read(relative)
        path = File.join(@root, relative)
        File.file?(path) ? File.read(path, encoding: "UTF-8") : ""
      rescue Errno::EACCES, Encoding::InvalidByteSequenceError
        ""
      end

      def ruby_version(gemfile)
        version_file = read(".ruby-version").strip
        return version_file unless version_file.empty?

        tool_versions = read(".tool-versions")[/^ruby\s+([^\s]+)/, 1]
        return tool_versions if tool_versions

        gemfile[/^\s*ruby\s+["']([^"']+)/, 1] || UNKNOWN
      end

      def dependency_version(name, gemfile, lockfile)
        locked = lockfile[/^\s{4}#{Regexp.escape(name)} \(([^)]+)\)/, 1]
        declared = gemfile[/^\s*gem\s+["']#{Regexp.escape(name)}["']\s*(?:,\s*["']([^"']+))?/, 1]
        locked || declared || (gemfile.match?(/^\s*gem\s+["']#{Regexp.escape(name)}["']/) ? UNKNOWN : UNKNOWN)
      end

      def bundler_version(lockfile)
        lockfile[/^BUNDLED WITH\s*\n\s+([^\s]+)/, 1] || UNKNOWN
      end

      def database_adapter(gemfile, lockfile)
        dependencies = "#{gemfile}\n#{lockfile}"
        { "pg" => "postgresql", "mysql2" => "mysql", "sqlite3" => "sqlite" }.each do |gem_name, adapter|
          return adapter if dependencies.match?(/(?:gem\s+["']|^\s{4})#{Regexp.escape(gem_name)}(?:["']|\s|\()/)
        end
        UNKNOWN
      end

      def schema_format(application)
        configured = application[/schema_format\s*=\s*:(ruby|sql)/, 1]
        return configured if configured
        return "ruby" if File.file?(File.join(@root, "db/schema.rb"))
        return "sql" if File.file?(File.join(@root, "db/structure.sql"))

        UNKNOWN
      end

      def test_framework(gemfile, lockfile)
        rspec = Dir.exist?(File.join(@root, "spec")) || "#{gemfile}\n#{lockfile}".include?("rspec-rails")
        minitest = Dir.exist?(File.join(@root, "test")) || "#{gemfile}\n#{lockfile}".match?(/(?:minitest|rails)/)
        return "mixed" if rspec && minitest
        return "rspec" if rspec
        return "minitest" if minitest

        UNKNOWN
      end

      def job_backend(application, gemfile, lockfile)
        configured = application[/active_job\.queue_adapter\s*=\s*:(\w+)/, 1]
        return configured if configured

        dependencies = "#{gemfile}\n#{lockfile}"
        %w[sidekiq solid_queue delayed_job resque].find { |name| dependencies.include?(name) } || UNKNOWN
      end

      def frontend_approach(gemfile, lockfile)
        approaches = []
        approaches << "importmap" if File.file?(File.join(@root, "config/importmap.rb")) || "#{gemfile}\n#{lockfile}".include?("importmap-rails")
        approaches << "jsbundling" if "#{gemfile}\n#{lockfile}".include?("jsbundling-rails")
        approaches << "asset_pipeline" if "#{gemfile}\n#{lockfile}".match?(/(?:sprockets-rails|propshaft)/)
        approaches << "node" if File.file?(File.join(@root, "package.json"))
        approaches.empty? ? UNKNOWN : approaches
      end

      def tools(gemfile, lockfile)
        dependencies = "#{gemfile}\n#{lockfile}"
        %w[rubocop standard brakeman bundler-audit].select { |tool| dependencies.include?(tool) }
      end

      def ci_commands
        patterns = [".github/workflows/*.{yml,yaml}", ".circleci/config.yml", ".gitlab-ci.yml"]
        patterns.flat_map { |pattern| Dir.glob(File.join(@root, pattern)) }.sort.flat_map do |path|
          File.readlines(path, chomp: true).filter_map do |line|
            match = line.match(/^\s*(?:-\s*)?(?:run|script):\s*["']?(.+?)["']?\s*$/)
            match && match[1]
          end
        rescue Errno::EACCES
          []
        end.uniq
      end

      def safe_test_commands(gemfile, lockfile)
        framework = test_framework(gemfile, lockfile)
        commands = []
        commands << "bin/rails test" if %w[minitest mixed].include?(framework)
        commands << "bundle exec rspec" if %w[rspec mixed].include?(framework)
        commands
      end

      def safe_boot_commands
        File.file?(File.join(@root, "bin/rails")) ? ["bin/rails runner <static-safe probe>"] : []
      end
    end
  end
end
