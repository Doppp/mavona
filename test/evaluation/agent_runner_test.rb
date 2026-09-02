# frozen_string_literal: true

require_relative "../test_helper"
require_relative "../../eval/lib/mavona/evaluation"

class EvaluationAgentRunnerTest < Minitest::Test
  class RecordingProcess
    attr_reader :calls
    def initialize = @calls = []
    def call(argv, **options)
      @calls << [argv, options]
      Mavona::Evaluation::ProcessResult.new(stdout: "", stderr: "", exit_status: 0, timed_out: false)
    end
  end

  def test_baseline_gets_only_the_task_and_mavona_uses_the_real_prompt_surface
    with_repository do |repository|
      commit = run!("git", "-C", repository, "rev-parse", "HEAD").strip
      task = Mavona::Evaluation::TaskDefinition.new({
        "id" => "fixture", "repo" => "fixture", "commit" => commit, "prompt" => "Require account names.",
        "budget" => { "max_duration_seconds" => 30 }, "grader" => "graders/hidden.rb"
      })
      process = RecordingProcess.new
      runner = Mavona::Evaluation::AgentRunner.new(process_runner: process, command: ["fake-agent"])

      runner.call(task:, condition: "baseline", worktree: repository)
      runner.call(task:, condition: "mavona", worktree: repository)

      baseline = process.calls[0][1].fetch(:stdin_data)
      mavona = process.calls[1][1].fetch(:stdin_data)
      assert_equal task.prompt, baseline
      refute_includes baseline, Mavona::AgentPrompt::POLICY.lines.first.strip
      assert_includes mavona, Mavona::AgentPrompt::POLICY.rstrip
      assert_includes mavona, task.prompt
      refute_includes baseline, task.grader
      refute_includes mavona, task.grader
      assert_equal "baseline", process.calls[0][1].fetch(:environment).fetch("MAVONA_EVAL_CONDITION")
      assert_equal "mavona", process.calls[1][1].fetch(:environment).fetch("MAVONA_EVAL_CONDITION")
    end
  end

  def test_rejects_unknown_conditions
    assert_raises(ArgumentError) do
      Mavona::Evaluation::AgentRunner.new.call(task: nil, condition: "secret-third-arm", worktree: Dir.pwd)
    end
  end
end
