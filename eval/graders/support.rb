# frozen_string_literal: true

require "fileutils"
require "json"
require "open3"
require "securerandom"

module HiddenGrader
  module_function

  def minitest(worktree, source, ruby:)
    execute(worktree, source, suffix: "_test.rb") do |path|
      ["mise", "exec", "ruby@#{ruby}", "--", "bundle", "exec", "rails", "test", path]
    end
  end

  def rspec(worktree, source, ruby:)
    execute(worktree, source, suffix: "_spec.rb") do |path|
      ["mise", "exec", "ruby@#{ruby}", "--", "bundle", "exec", "rspec", path, "--format", "progress"]
    end
  end

  def execute(worktree, source, suffix:)
    relative = File.join("tmp", "mavona-hidden-#{SecureRandom.hex(8)}#{suffix}")
    absolute = File.join(worktree, relative)
    FileUtils.mkdir_p(File.dirname(absolute))
    File.write(absolute, source)
    stdout, stderr, status = Open3.capture3(*yield(relative), chdir: worktree)
    state = status.success? ? "passed" : "failed"
    puts JSON.generate(
      "grader_status" => state,
      "tests_status" => state,
      "notes" => [stdout, stderr].join("\n").strip[-6000..]
    )
    exit(status.success? ? 0 : 1)
  rescue StandardError => error
    puts JSON.generate("grader_status" => "error", "tests_status" => "error", "notes" => "#{error.class}: #{error.message}")
    exit 2
  ensure
    FileUtils.rm_f(absolute) if absolute
  end
end
