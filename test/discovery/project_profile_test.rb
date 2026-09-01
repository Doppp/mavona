# frozen_string_literal: true

require_relative "../test_helper"

class ProjectProfileTest < Minitest::Test
  def test_statically_profiles_rails_project
    with_repository do |repository|
      result = Mavona::Discovery::ProjectProfile.new(repository).inspect

      assert_equal "rails", result.fetch("project_type")
      assert_equal "3.3.6", result.fetch("ruby_version")
      assert_equal "7.2.2", result.fetch("rails_version")
      assert_equal "2.5.23", result.fetch("bundler_version")
      assert_equal "postgresql", result.fetch("database_adapter")
      assert_equal "ruby", result.fetch("schema_format")
      assert_equal "minitest", result.fetch("test_framework")
      assert_equal "sidekiq", result.fetch("job_backend")
      assert_includes result.fetch("lint_security_tools"), "rubocop"
      assert_includes result.fetch("ci_commands"), "bin/rails test"
    end
  end

  def test_failed_boot_keeps_static_profile_and_marks_boot_facts
    with_repository(rails: false) do |repository|
      build_rails_app(repository, boot: :fail)
      result = Mavona::Discovery.call(path: repository, boot: true, session_id: "init_boot_failure")

      assert_equal "DISCOVERED", result.fetch("status")
      assert_equal "7.2.2", result.dig("profile", "rails_version")
      assert_equal "failed", result.dig("boot", "status")
      assert_match(/missing credentials/, result.dig("boot", "error"))
      assert result.fetch("evidence").any? { |item| item["kind"] == "legibility" && item["subject"] == "legibility.rails_boot" }
    end
  end

  def test_discovery_evidence_ids_are_stable_across_sessions
    with_repository do |repository|
      first = Mavona::Discovery.call(path: repository, boot: false, session_id: "init_first")
      second = Mavona::Discovery.call(path: repository, boot: false, session_id: "init_second")

      first_ids = first.fetch("evidence").to_h { |item| [item.fetch("subject"), item.fetch("id")] }
      second_ids = second.fetch("evidence").to_h { |item| [item.fetch("subject"), item.fetch("id")] }
      assert_equal first_ids, second_ids
    end
  end
end
