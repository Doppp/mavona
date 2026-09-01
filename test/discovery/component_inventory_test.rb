# frozen_string_literal: true

require_relative "../test_helper"

class ComponentInventoryTest < Minitest::Test
  def test_inventories_rails_components_and_schema
    with_repository do |repository|
      inventory = Mavona::Discovery::ComponentInventory.new(repository).inspect

      assert_equal ["app/models/account.rb"], inventory.dig("models", "paths")
      assert_equal 1, inventory.dig("controllers", "count")
      assert_equal 1, inventory.dig("jobs", "count")
      assert_equal 1, inventory.dig("services", "count")
      assert_equal 1, inventory.dig("concerns", "count")
      assert_equal ["accounts"], inventory.dig("schema_tables", "names")
      assert_equal 1, inventory.dig("custom_autoload_eager_load_paths", "count")
      assert_equal 1, inventory.dig("rake_tasks", "count")
    end
  end
end
