# frozen_string_literal: true

require_relative "../test_helper"
require_relative "../../eval/lib/mavona/evaluation"

class EvaluationRunIntegrationTest < Minitest::Test
  FIXTURES = File.expand_path("../fixtures/evaluation", __dir__)

  Catalog = Data.define(:root, :repositories)

  def test_complete_paired_loop_is_reproducible_and_keeps_the_grader_outside_the_agent_worktree
    with_repository do |source|
      commit = run!("git", "-C", source, "rev-parse", "HEAD").strip
      task = Mavona::Evaluation::TaskDefinition.new({
        "id" => "account-name", "repo" => "fixture", "commit" => commit,
        "prompt" => "Require every account to have a name.",
        "budget" => { "max_duration_seconds" => 30 }, "grader" => "graders/account_name.rb"
      })

      Dir.mktmpdir("mavona-eval-integration") do |temporary|
        results = Mavona::Evaluation::ResultStore.new(directory: File.join(temporary, "results"))
        repositories = Mavona::Evaluation::RepositoryManager.new(cache_root: File.join(temporary, "cache"))
        agent = Mavona::Evaluation::AgentRunner.new(
          command: [RbConfig.ruby, File.join(FIXTURES, "fake_agent.rb")]
        )
        catalog = Catalog.new(FIXTURES, { "fixture" => { "id" => "fixture", "url" => source, "commit" => commit } })
        runner = Mavona::Evaluation::Run.new(
          catalog:, repositories:, agent:,
          grader: Mavona::Evaluation::GraderRunner.new(root: FIXTURES), results:
        )

        baseline = runner.call(task:, condition: "baseline")
        mavona = runner.call(task:, condition: "mavona")

        assert_equal "failed", baseline.grader_status
        assert_equal "passed", mavona.grader_status
        assert_equal ["agent_observation.json", "app/models/account.rb"], mavona.files_changed
        assert_equal 2, results.all.size
        aggregate = Mavona::Evaluation::Report.new(results.all).aggregate
        assert_equal 1, aggregate.fetch("mavona_only")
        assert_equal 0, aggregate.fetch("baseline_verified")
        assert_equal 1, aggregate.fetch("mavona_verified")
      end
    end
  end
end
