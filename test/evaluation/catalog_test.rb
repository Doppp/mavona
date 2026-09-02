# frozen_string_literal: true

require_relative "../test_helper"
require_relative "../../eval/lib/mavona/evaluation"

class EvaluationCatalogTest < Minitest::Test
  def test_smoke_catalog_has_three_repositories_and_three_tasks_each
    catalog = Mavona::Evaluation::Catalog.new

    assert catalog.validate!
    assert_equal 3, catalog.repositories.size
    assert_equal 9, catalog.tasks.size
    assert_equal [3], catalog.tasks.group_by(&:repo).values.map(&:size).uniq
    assert_equal %w[baseline mavona], Mavona::Evaluation::AgentRunner::CONDITIONS
  end

  def test_every_task_is_pinned_and_its_prompt_does_not_expose_grader_material
    catalog = Mavona::Evaluation::Catalog.new

    catalog.tasks.each do |task|
      assert_match(/\A[0-9a-f]{40}\z/, task.commit)
      grader = File.read(File.join(catalog.root, task.grader))
      refute_includes task.prompt, task.grader
      refute_includes task.prompt, grader
    end
  end
end
