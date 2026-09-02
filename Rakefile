# frozen_string_literal: true

require "rake/testtask"

require_relative "eval/lib/mavona/evaluation"

Rake::TestTask.new do |task|
  task.libs << "test"
  task.pattern = "test/**/*_test.rb"
end

task default: :test

namespace :eval do
  desc "Fetch and validate the pinned smoke-suite repositories"
  task :setup do
    Mavona::Evaluation::CLI.new.run_setup
  end

  desc "Run the smoke suite (TASK=id and CONDITION=baseline|mavona are optional)"
  task :run do
    Mavona::Evaluation::CLI.new.run
  end

  desc "Report paired outcomes from recorded results"
  task :report do
    Mavona::Evaluation::CLI.new.report
  end

  desc "Remove cached repositories, worktrees, and run artifacts"
  task :reset do
    Mavona::Evaluation::CLI.new.reset
  end
end
