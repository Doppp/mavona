# frozen_string_literal: true

require_relative "../test_helper"
require_relative "../../eval/lib/mavona/evaluation"

class EvaluationTaskDefinitionTest < Minitest::Test
  def attributes
    {
      "id" => "accounts-validation", "repo" => "fixture", "commit" => "a" * 40,
      "prompt" => "Require account names.", "budget" => { "max_duration_seconds" => 60 },
      "grader" => "graders/accounts_validation.rb"
    }
  end

  def test_accepts_the_minimum_schema
    task = Mavona::Evaluation::TaskDefinition.new(attributes)

    assert_equal "accounts-validation", task.id
    assert_equal 60, task.max_duration
  end

  def test_rejects_missing_fields_and_symbolic_commits
    error = assert_raises(ArgumentError) { Mavona::Evaluation::TaskDefinition.new(attributes.reject { |key, _| key == "grader" }) }
    assert_match(/grader/, error.message)

    error = assert_raises(ArgumentError) do
      Mavona::Evaluation::TaskDefinition.new(attributes.merge("commit" => "main"))
    end
    assert_match(/40-character SHA/, error.message)
  end

  def test_rejects_graders_outside_the_protected_directory
    error = assert_raises(ArgumentError) do
      Mavona::Evaluation::TaskDefinition.new(attributes.merge("grader" => "../visible_test.rb"))
    end
    assert_match(/relative path/, error.message)
  end
end
