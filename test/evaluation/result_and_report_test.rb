# frozen_string_literal: true

require_relative "../test_helper"
require_relative "../../eval/lib/mavona/evaluation"

class EvaluationResultAndReportTest < Minitest::Test
  def result(task_id:, condition:, status:)
    Mavona::Evaluation::Result.new(
      task_id:, repo: "fixture", commit: "a" * 40, condition:, agent: "codex",
      started_at: "2026-09-03T00:00:00Z", finished_at: "2026-09-03T00:00:01Z", duration: 1.0,
      exit_status: 0, grader_status: status, tests_status: "not_run", files_changed: [],
      human_intervention: false, notes: ""
    )
  end

  def test_result_round_trips_as_json
    Dir.mktmpdir do |directory|
      store = Mavona::Evaluation::ResultStore.new(directory:)
      original = result(task_id: "one", condition: "baseline", status: "passed")
      path = store.write(original)

      assert_equal original.to_h, JSON.parse(File.read(path))
      assert_equal [original.to_h], store.all

      artifact = store.write_artifact(task_id: "one", condition: "baseline", name: "agent.stdout.log", content: "done\n")
      assert_equal "done\n", File.read(artifact)
    end
  end

  def test_report_aggregates_paired_outcomes_without_treating_not_run_as_passed
    results = [
      result(task_id: "one", condition: "baseline", status: "failed"),
      result(task_id: "one", condition: "mavona", status: "passed"),
      result(task_id: "two", condition: "baseline", status: "passed"),
      result(task_id: "two", condition: "mavona", status: "not_run"),
      result(task_id: "three", condition: "baseline", status: "passed"),
      result(task_id: "three", condition: "mavona", status: "passed"),
      result(task_id: "four", condition: "baseline", status: "error")
    ].map(&:to_h)

    report = Mavona::Evaluation::Report.new(results)
    assert_equal({
      "baseline_verified" => 2, "mavona_verified" => 2, "baseline_only" => 1,
      "mavona_only" => 1, "both_pass" => 1, "both_fail" => 1
    }, report.aggregate)
    assert_includes report.render, "mavona:   not_run"
  end
end
