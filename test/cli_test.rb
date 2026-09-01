# frozen_string_literal: true

require_relative "test_helper"

class CLITest < Minitest::Test
  def test_init_emits_canonical_json
    with_repository do |repository|
      stdout = StringIO.new
      stderr = StringIO.new
      status = Mavona::CLI.new(stdout:, stderr:).run(["init", repository, "--no-boot"])
      parsed = JSON.parse(stdout.string)

      assert_equal 0, status
      assert_equal "0.1.0", parsed.fetch("schema_version")
      assert_equal "DISCOVERED", parsed.fetch("status")
      assert_empty stderr.string
    end
  end

  def test_plan_is_explicitly_deferred
    stderr = StringIO.new
    status = Mavona::CLI.new(stdout: StringIO.new, stderr:).run(["plan", "do work"])

    assert_equal 2, status
    assert_match(/deferred until Phase 0/, stderr.string)
  end

  def test_discovery_does_not_mutate_target_repository
    with_repository do |repository|
      before = run!("git", "-C", repository, "status", "--porcelain=v1")
      Mavona::Discovery.call(path: repository, boot: false, session_id: "init_read_only")
      after = run!("git", "-C", repository, "status", "--porcelain=v1")

      assert_equal before, after
      assert_empty after
    end
  end
end
