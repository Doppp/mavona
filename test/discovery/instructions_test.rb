# frozen_string_literal: true

require_relative "../test_helper"

class InstructionsTest < Minitest::Test
  def test_discovers_scoped_instruction_files_without_vendor_content
    with_repository do |repository|
      write(repository, "AGENTS.md", "Root instructions\n")
      write(repository, "app/services/CLAUDE.md", "Service instructions\n")
      write(repository, "engines/billing/README.md", "Billing instructions\n")
      write(repository, "vendor/gem/AGENTS.md", "Ignore me\n")

      result = Mavona::Discovery::Instructions.new(repository).inspect
      paths = result.map { |instruction| instruction.fetch("path") }

      assert_includes paths, "AGENTS.md"
      assert_includes paths, "app/services/CLAUDE.md"
      assert_includes paths, "engines/billing/README.md"
      refute_includes paths, "vendor/gem/AGENTS.md"
      assert_equal "app/services", result.find { |item| item["path"] == "app/services/CLAUDE.md" }.fetch("scope")
    end
  end
end
