# frozen_string_literal: true

require "fileutils"
require "minitest/autorun"
require "open3"
require "stringio"
require "tmpdir"

$LOAD_PATH.unshift(File.expand_path("../lib", __dir__))
require "mavona"

module RepositoryFixtures
  def with_repository(rails: true, branch: "develop")
    Dir.mktmpdir("mavona-repository") do |directory|
      run!("git", "init", "--initial-branch", branch, directory)
      run!("git", "-C", directory, "config", "user.email", "fixtures@mavona.test")
      run!("git", "-C", directory, "config", "user.name", "Mavona Fixtures")
      build_rails_app(directory) if rails
      write(directory, "README.md", "# Fixture repository\n") unless File.exist?(File.join(directory, "README.md"))
      run!("git", "-C", directory, "add", ".")
      run!("git", "-C", directory, "commit", "-m", "fixture baseline")
      yield directory
    end
  end

  def build_rails_app(root, prefix: ".", boot: nil)
    app = File.expand_path(prefix, root)
    write(app, "Gemfile", <<~RUBY)
      source "https://rubygems.org"
      ruby "3.3.6"
      gem "rails", "~> 7.2"
      gem "pg"
      gem "sidekiq"
      gem "rubocop"
      gem "brakeman"
    RUBY
    write(app, "Gemfile.lock", <<~LOCK)
      GEM
        specs:
          rails (7.2.2)
          pg (1.5.9)
          sidekiq (7.3.1)
          rubocop (1.68.0)
          brakeman (6.2.2)

      BUNDLED WITH
         2.5.23
    LOCK
    write(app, ".ruby-version", "3.3.6\n")
    write(app, "config/application.rb", <<~RUBY)
      module FixtureApp
        class Application < Rails::Application
          config.active_job.queue_adapter = :sidekiq
          config.autoload_paths << root.join("extras")
        end
      end
    RUBY
    write(app, "config/routes.rb", "Rails.application.routes.draw { resources :accounts }\n")
    write(app, "app/models/account.rb", "class Account < ApplicationRecord; end\n")
    write(app, "app/controllers/accounts_controller.rb", "class AccountsController < ApplicationController; end\n")
    write(app, "app/jobs/sync_account_job.rb", "class SyncAccountJob < ApplicationJob; end\n")
    write(app, "app/services/accounts/suspender.rb", "class Accounts::Suspender; end\n")
    write(app, "app/models/concerns/auditable.rb", "module Auditable; end\n")
    write(app, "db/migrate/20260901000000_create_accounts.rb", "class CreateAccounts; end\n")
    write(app, "db/schema.rb", "create_table \"accounts\", force: :cascade do |t|\nend\n")
    write(app, "test/models/account_test.rb", "class AccountTest; end\n")
    write(app, "test/fixtures/accounts.yml", "one:\n  name: One\n")
    write(app, "config/initializers/filter_parameter_logging.rb", "# fixture\n")
    write(app, "lib/tasks/accounts.rake", "task :accounts\n")
    write(app, ".github/workflows/ci.yml", "steps:\n  - run: bin/rails test\n")
    return if boot.nil?

    source = boot == :pass ? "STDOUT.write('mavona_boot_ok')\n" : "warn 'missing credentials'; exit 1\n"
    write(app, "bin/rails", source)
  end

  def write(root, relative, content)
    path = File.join(root, relative)
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, content)
  end

  def run!(*command)
    stdout, stderr, status = Open3.capture3(*command)
    raise "#{command.join(' ')} failed: #{stderr}" unless status.success?

    stdout
  end
end

class Minitest::Test
  include RepositoryFixtures
end
