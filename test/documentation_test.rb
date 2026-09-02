# frozen_string_literal: true

require_relative "test_helper"

class DocumentationTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  CANONICAL = %w[README.md SPEC-V0.1.md ROADMAP.md VISION.md DECISIONS.md].freeze

  def test_canonical_docs_use_the_understand_change_verify_model
    documentation = CANONICAL.to_h { |name| [name, File.read(File.join(ROOT, name))] }

    assert_includes documentation.fetch("README.md"), "Understand → Change → Verify"
    assert_includes documentation.fetch("VISION.md"), "Understand → Change → Verify"
    assert_includes documentation.fetch("SPEC-V0.1.md"), "direct_change | lightweight_plan | full_plan"
    assert_includes documentation.fetch("ROADMAP.md"), "# 0.1.0 — Rails understanding harness"
    assert_includes documentation.fetch("DECISIONS.md"), "## D010 — Planning is proportional"
    documentation.each_value { |content| refute_includes content, "# 0.1.0 — Planning harness" }
  end

  def test_spec_documents_the_runtime_policy_exactly
    specification = File.read(File.join(ROOT, "SPEC-V0.1.md"))

    assert_includes specification, Mavona::AgentPrompt::POLICY.rstrip
  end

  def test_repository_instructions_keep_mechanical_work_in_the_harness
    instructions = File.read(File.join(ROOT, "AGENTS.md"))

    assert_includes instructions, "Keep the agent-facing policy short"
    assert_includes instructions, "Start with narrow repository evidence"
    assert_includes instructions, "agent narration is not verification"
  end
end
