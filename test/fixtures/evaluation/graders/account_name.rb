# frozen_string_literal: true

require "json"

worktree = ARGV.fetch(0)
observation = JSON.parse(File.read(File.join(worktree, "agent_observation.json")))
implementation = File.read(File.join(worktree, "app/models/account.rb"))
grader_was_hidden = observation.fetch("visible_files").none? { |path| path.include?("grader") } &&
  !observation.fetch("prompt").include?("validates :name")
passed = implementation.include?("validates :name, presence: true") && grader_was_hidden

puts JSON.generate(
  "grader_status" => passed ? "passed" : "failed",
  "tests_status" => "not_run",
  "notes" => passed ? "independent acceptance passed" : "required validation absent or grader leaked"
)
exit(passed ? 0 : 1)
