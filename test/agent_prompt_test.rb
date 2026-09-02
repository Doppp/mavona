# frozen_string_literal: true

require_relative "test_helper"

class AgentPromptTest < Minitest::Test
  def test_policy_is_brief_and_rails_native
    policy = Mavona::AgentPrompt::POLICY

    assert_operator policy.split.size, :<=, 80
    assert_includes policy, "existing Ruby on Rails application"
    assert_includes policy, "existing conventions"
    assert_includes policy, "standard Rails mechanisms"
    assert_includes policy, "integrated Rails stack"
    assert_includes policy, "new abstractions only when justified"
    assert_includes policy, "Mavona will independently verify"
  end

  def test_policy_omits_procedural_boilerplate
    policy = Mavona::AgentPrompt::POLICY.downcase

    refute_includes policy, "inspect the codebase"
    refute_includes policy, "implementation plan"
    refute_includes policy, "run tests"
    refute_includes policy, "downstream users"
    refute_includes policy, "risks and assumptions"
  end

  def test_render_adds_only_the_task_and_selected_evidence
    prompt = Mavona::AgentPrompt.render(
      task: "Suspend an account",
      evidence: {
        "rails_version" => "7.2.2",
        "relevant_files" => ["app/models/account.rb", "test/models/account_test.rb"]
      }
    )

    assert_includes prompt, "Task:\nSuspend an account"
    assert_includes prompt, "Repository evidence:"
    assert_includes prompt, '"rails_version": "7.2.2"'
    assert_includes prompt, '"app/models/account.rb"'
  end

  def test_render_rejects_missing_task_or_unstructured_evidence
    assert_raises(ArgumentError) { Mavona::AgentPrompt.render(task: " ", evidence: {}) }
    assert_raises(ArgumentError) { Mavona::AgentPrompt.render(task: "Work", evidence: "everything") }
  end
end
