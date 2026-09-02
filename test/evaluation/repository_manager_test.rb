# frozen_string_literal: true

require_relative "../test_helper"
require_relative "../../eval/lib/mavona/evaluation"

class EvaluationRepositoryManagerTest < Minitest::Test
  def test_each_run_starts_at_the_pinned_commit_without_prior_changes
    with_repository do |source|
      commit = run!("git", "-C", source, "rev-parse", "HEAD").strip
      Dir.mktmpdir("mavona-eval-cache") do |cache|
        manager = Mavona::Evaluation::RepositoryManager.new(cache_root: cache)
        repository = { "id" => "fixture", "url" => source, "commit" => commit }
        task = Mavona::Evaluation::TaskDefinition.new({
          "id" => "fixture-task", "repo" => "fixture", "commit" => commit, "prompt" => "Change it",
          "budget" => { "max_duration_seconds" => 30 }, "grader" => "graders/fixture.rb"
        })

        first = manager.prepare(repository, task:, condition: "baseline")
        File.write(File.join(first, "README.md"), "changed\n")
        File.write(File.join(first, "untracked.txt"), "changed\n")
        manager.remove(first)

        second = manager.prepare(repository, task:, condition: "mavona")
        assert_equal "# Fixture repository\n", File.read(File.join(second, "README.md"))
        refute_path_exists File.join(second, "untracked.txt")
        assert_equal commit, run!("git", "-C", second, "rev-parse", "HEAD").strip
      ensure
        manager&.remove(second)
      end
    end
  end
end
