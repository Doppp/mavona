# frozen_string_literal: true

require_relative "../test_helper"

class RailsRootsTest < Minitest::Test
  def test_multiple_roots_are_ambiguous_at_repository_scope
    with_repository(rails: false) do |repository|
      build_rails_app(repository, prefix: "apps/admin")
      build_rails_app(repository, prefix: "apps/storefront")

      result = Mavona::Discovery.call(path: repository, boot: false, session_id: "init_multi")
      assert_equal "NEEDS_DECISION", result.fetch("status")
      assert_equal %w[apps/admin apps/storefront], result.dig("rails", "candidate_roots")
      assert_equal "unknown", result.dig("rails", "selected_root")
      assert_equal "unknown", result.dig("profile", "rails_version")
    end
  end

  def test_working_directory_safely_scopes_one_root
    with_repository(rails: false) do |repository|
      build_rails_app(repository, prefix: "apps/admin")
      build_rails_app(repository, prefix: "apps/storefront")

      result = Mavona::Discovery.call(path: File.join(repository, "apps/admin/app/models"), boot: false, session_id: "init_scoped")
      assert_equal "DISCOVERED", result.fetch("status")
      assert_equal "apps/admin", result.dig("rails", "selected_root")
    end
  end
end
