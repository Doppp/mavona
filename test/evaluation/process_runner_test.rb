# frozen_string_literal: true

require_relative "../test_helper"
require_relative "../../eval/lib/mavona/evaluation"

class EvaluationProcessRunnerTest < Minitest::Test
  def test_records_timeout_as_a_distinct_failure
    result = Mavona::Evaluation::ProcessRunner.new.call(
      [RbConfig.ruby, "-e", "sleep 5"], chdir: Dir.pwd, timeout_seconds: 0.05
    )

    assert result.timed_out
    refute result.success?
  end

  def test_records_missing_executable_as_error_not_timeout
    result = Mavona::Evaluation::ProcessRunner.new.call(
      ["definitely-not-a-mavona-command"], chdir: Dir.pwd, timeout_seconds: 1
    )

    refute result.timed_out
    assert_nil result.exit_status
    refute result.success?
  end
end
